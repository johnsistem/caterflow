
"use server";

import { createClient } from "@/utils/supabase/server";
import { startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

export type FinancialPeriod = "this_month" | "last_quarter" | "this_year";

export async function getFinancialData(period: FinancialPeriod) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: "No authenticated user" };
    }

    const { data: userData } = await supabase
      .from("User")
      .select("organizationId, organization:Organization(currency)")
      .eq("id", user.id)
      .single();

    if (!userData?.organizationId) {
      return { error: "Organization not found for user" };
    }

    const orgId = userData.organizationId;
    const currency = (userData as any).organization?.currency || "USD";
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_quarter":
        const lastQuarterStart = subMonths(startOfQuarter(now), 3);
        startDate = startOfQuarter(lastQuarterStart);
        endDate = endOfQuarter(lastQuarterStart); 
        break;
      case "this_year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfYear(now);
        endDate = endOfYear(now);
    }

    // Fetch Confirmed Events in Range
    const { data: events, error: eventsError } = await supabase
      .from("Event")
      .select(`
        *,
        recipes:EventRecipe(
          quantity,
          recipe:Recipe(
            id,
            name,
            price,
            totalCost,
            ingredients:RecipeIngredient(
              quantity,
              ingredient:Ingredient(cost)
            )
          )
        )
      `)
      .eq("organizationId", orgId)
      .eq("status", "CONFIRMED")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date", { ascending: true });

    if (eventsError) {
      console.error("Financials Error:", eventsError);
      return { error: eventsError.message };
    }

    // 2. Process Data
    let totalRevenue = 0;
    let totalCost = 0;
    const dailyDataMap = new Map<string, { revenue: number; profit: number; cost: number }>();
    const monthlyDataMap = new Map<string, { revenue: number; profit: number; count: number }>();
    const recipePerformance = new Map<string, { name: string; revenue: number; cost: number; count: number }>();

    for (const event of (events || [])) {
      const eventRevenue = event.totalPrice || 0;
      let eventCost = 0;

      if (event.recipes && Array.isArray(event.recipes)) {
        for (const eventRecipe of event.recipes) {
          const recipe = eventRecipe.recipe;
          if (!recipe) continue;

          const servingsRatio = eventRecipe.quantity || 1; 
          let recipeBatchCost = 0;
          
          if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            for (const ri of recipe.ingredients) {
              if (ri.ingredient) {
                recipeBatchCost += (ri.quantity || 0) * (ri.ingredient.cost || 0);
              }
            }
          }
          
          const totalRecipeCostForEvent = recipeBatchCost * servingsRatio;
          eventCost += totalRecipeCostForEvent;

          const existing = recipePerformance.get(recipe.id) || { name: recipe.name, revenue: 0, cost: 0, count: 0 };
          const theoreticalRevenue = (recipe.price || 0) * servingsRatio;
          
          recipePerformance.set(recipe.id, {
            name: recipe.name,
            revenue: existing.revenue + theoreticalRevenue,
            cost: existing.cost + totalRecipeCostForEvent,
            count: existing.count + 1
          });
        }
      }

      totalRevenue += eventRevenue;
      totalCost += eventCost;

      const eventDate = new Date(event.date);
      const dateKey = format(eventDate, "yyyy-MM-dd");
      const dayStat = dailyDataMap.get(dateKey) || { revenue: 0, profit: 0, cost: 0 };
      dayStat.revenue += eventRevenue;
      dayStat.cost += eventCost;
      dayStat.profit += (eventRevenue - eventCost);
      dailyDataMap.set(dateKey, dayStat);

      const monthKey = format(eventDate, "yyyy-MM");
      const monthStat = monthlyDataMap.get(monthKey) || { revenue: 0, profit: 0, count: 0 };
      monthStat.revenue += eventRevenue;
      monthStat.profit += (eventRevenue - eventCost);
      monthStat.count += 1;
      monthlyDataMap.set(monthKey, monthStat);
    }

    const totalProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // 3. Aggregate for Chart
    let chartData;
    
    // Find last month with data to avoid "falling to zero" look
    let lastMonthWithData = "";
    monthlyDataMap.forEach((val, key) => {
      if (val.revenue > 0 || val.profit !== 0 || val.count > 0) {
        if (key > lastMonthWithData) lastMonthWithData = key;
      }
    });

    if (period === "this_year") {
      const allMonths = eachMonthOfInterval({ start: startDate, end: endDate });
      chartData = allMonths.map((month: Date) => {
        const monthKey = format(month, "yyyy-MM");
        const outOfRange = monthKey > lastMonthWithData;
        const data = monthlyDataMap.get(monthKey);
        
        return {
          date: format(month, "MMM"),
          fullDate: monthKey,
          revenue: outOfRange ? null : (data?.revenue || 0),
          profit: outOfRange ? null : (data?.profit || 0),
          eventCount: outOfRange ? null : (data?.count || 0),
        };
      });
    } else {
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      chartData = allDays.map((day: Date) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const data = dailyDataMap.get(dateKey);
        const monthKey = format(day, "yyyy-MM");
        const monthData = monthlyDataMap.get(monthKey); // This is risky for daily view but let's stick to simple logic
        
        return {
          date: format(day, "MMM d"),
          fullDate: dateKey,
          revenue: data ? data.revenue : 0,
          profit: data ? data.profit : 0,
          eventCount: data ? 1 : 0, // Very simple daily count
        };
      });
    }

    const topRecipesByMargin = Array.from(recipePerformance.values())
      .map(r => ({
        name: r.name,
        margin: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
        value: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);

    // 4. Distinction between Historical and Projected
    let historicalRevenue = 0;
    let historicalCost = 0;
    let projectedRevenue = 0;
    let projectedCost = 0;

    const todayStr = format(now, "yyyy-MM-dd");

    for (const event of (events || [])) {
      const eventDateStr = format(new Date(event.date), "yyyy-MM-dd");
      const isProjected = eventDateStr >= todayStr;
      
      let eventCost = 0;
      if (event.recipes && Array.isArray(event.recipes)) {
        for (const er of event.recipes) {
          const recipe = er.recipe as any;
          if (!recipe) continue;
          let recipeBatchCost = 0;
          if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            for (const ri of recipe.ingredients) {
              if (ri.ingredient) recipeBatchCost += (ri.quantity || 0) * (ri.ingredient.cost || 0);
            }
          }
          eventCost += recipeBatchCost * (er.quantity || 1);
        }
      }

      if (isProjected) {
        projectedRevenue += event.totalPrice || 0;
        projectedCost += eventCost;
      } else {
        historicalRevenue += event.totalPrice || 0;
        historicalCost += eventCost;
      }
    }

    // Update Chart Data with Projected Flag and split keys for better rendering
    if (chartData) {
       chartData = (chartData as any).map((item: any, idx: number, arr: any[]) => {
         const isProjected = item.fullDate >= todayStr.substring(0, item.fullDate.length);
         
         // To make the lines connect, the first projected point should also be the last historical point
         // or we just let Recharts connect them. Using explicit keys:
         return {
           ...item,
           isProjected,
           // Keep original revenue/profit for the tooltip
           revenue_hist: !isProjected ? item.revenue : (idx > 0 && !arr[idx-1].isProjected ? item.revenue : null),
           revenue_proj: isProjected ? item.revenue : (idx < arr.length - 1 && arr[idx+1].isProjected ? item.revenue : null),
           profit_hist: !isProjected ? item.profit : (idx > 0 && !arr[idx-1].isProjected ? item.profit : null),
           profit_proj: isProjected ? item.profit : (idx < arr.length - 1 && arr[idx+1].isProjected ? item.profit : null),
         };
       });
    }

    // 5. Intelligent Insights with Projection Logic
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const { data: lastMonthEvents } = await supabase
      .from("Event")
      .select(`
        totalPrice,
        recipes:EventRecipe(
          quantity,
          recipe:Recipe(
            ingredients:RecipeIngredient(
              quantity,
              ingredient:Ingredient(cost)
            )
          )
        )
      `)
      .eq("organizationId", orgId)
      .eq("status", "CONFIRMED")
      .gte("date", lastMonthStart.toISOString())
      .lte("date", lastMonthEnd.toISOString());

    let lastMonthRevenue = 0;
    let lastMonthCost = 0;

    for (const event of (lastMonthEvents || [])) {
      lastMonthRevenue += event.totalPrice || 0;
      if (event.recipes && Array.isArray(event.recipes)) {
        for (const er of event.recipes) {
          const recipe = er.recipe as any;
          if (!recipe) continue;
          let recipeBatchCost = 0;
          if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            for (const ri of recipe.ingredients) {
              if (ri.ingredient) recipeBatchCost += (ri.quantity || 0) * (ri.ingredient.cost || 0);
            }
          }
          lastMonthCost += recipeBatchCost * (er.quantity || 1);
        }
      }
    }

    const lastMonthMargin = lastMonthRevenue > 0 ? ((lastMonthRevenue - lastMonthCost) / lastMonthRevenue) * 100 : 0;
    const historicalMargin = historicalRevenue > 0 ? ((historicalRevenue - historicalCost) / historicalRevenue) * 100 : 0;
    
    // Insights Content Composition
    let marginTrendText = "";
    if (historicalRevenue > 0 && lastMonthRevenue > 0) {
      const marginDiff = historicalMargin - lastMonthMargin;
      marginTrendText = `Tu rentabilidad histórica es del ${historicalMargin.toFixed(1)}%. Esto representa un ${Math.abs(marginDiff).toFixed(1)}% ${marginDiff >= 0 ? "más" : "menos"} que el mes anterior.`;
    } else {
      marginTrendText = "¡Buen comienzo! Estamos empezando a recopilar tus datos históricos para comparar tu crecimiento.";
    }

    const currentMonthProjectedProfit = projectedRevenue - projectedCost;
    const currentMonthMargin = projectedRevenue > 0 ? ((projectedRevenue - projectedCost) / projectedRevenue) * 100 : 0;
    
    let projectionText = "";
    if (projectedRevenue > 0) {
      projectionText = `Para este mes de ${format(now, "MMMM")}, tienes proyectado un beneficio de ${new Intl.NumberFormat(currency === "NIO" ? "es-NI" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(currentMonthProjectedProfit)} con un margen del ${currentMonthMargin.toFixed(1)}%.`;
    }

    // Quarterly Projection
    const quarterEnd = endOfQuarter(now);
    const { data: qEvents } = await supabase
      .from("Event")
      .select(`totalPrice, recipes:EventRecipe(quantity, recipe:Recipe(ingredients:RecipeIngredient(quantity, ingredient:Ingredient(cost))))`)
      .eq("organizationId", orgId)
      .eq("status", "CONFIRMED")
      .gte("date", todayStr)
      .lte("date", quarterEnd.toISOString());

    let qProjectedRevenue = 0;
    let qProjectedCost = 0;
    for (const e of (qEvents || [])) {
       qProjectedRevenue += e.totalPrice || 0;
       (e.recipes as any[] || []).forEach(er => {
          const r = er.recipe;
          let rCost = 0;
          (r.ingredients || []).forEach((ri: any) => {
             if (ri.ingredient) rCost += (ri.quantity || 0) * (ri.ingredient.cost || 0);
          });
          qProjectedCost += rCost * (er.quantity || 1);
       });
    }

    let quarterlyText = "";
    if (qProjectedRevenue > 0) {
      quarterlyText = `Tu cartera de eventos futuros ya asegura ${new Intl.NumberFormat(currency === "NIO" ? "es-NI" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(qProjectedRevenue - qProjectedCost)} en beneficios para el primer trimestre.`;
    }

    const topSelling = Array.from(recipePerformance.values()).sort((a, b) => b.count - a.count)[0];
    const topSellingMargin = topSelling && topSelling.revenue > 0 ? ((topSelling.revenue - topSelling.cost) / topSelling.revenue) * 100 : 0;

    const insights = {
      marginTrend: { text: marginTrendText },
      projection: projectionText ? { text: projectionText } : null,
      quarterly: quarterlyText ? { text: quarterlyText } : null,
      topRecipeAlert: topSelling && topSellingMargin < 30 ? {
        name: topSelling.name,
        margin: topSellingMargin,
        text: `Tu plato más vendido (${topSelling.name}) tiene un margen bajo del ${topSellingMargin.toFixed(1)}%. Considera ajustar su precio.`
      } : null,
      suggestion: "Revisa tus precios de inventario periódicamente para mantener tus márgenes."
    };

    return {
      kpi: {
        revenue: totalRevenue,
        profit: totalProfit,
        margin: margin,
      },
      chartData,
      topRecipes: topRecipesByMargin,
      periodLabel: `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`,
      debugCount: (events || []).length,
      currency: currency,
      insights
    };
  } catch (error: any) {
    console.error("Critical Error in getFinancialData:", error);
    return { error: error.message };
  }
}
