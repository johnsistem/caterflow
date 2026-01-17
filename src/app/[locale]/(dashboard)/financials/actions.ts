
"use server";

import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, eachDayOfInterval } from "date-fns";

export type FinancialPeriod = "this_month" | "last_quarter" | "this_year";

export async function getFinancialData(period: FinancialPeriod) {
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
      endDate = endOfQuarter(lastQuarterStart); // Wait, logic might be safer just using subQuarters if imported, but subMonths(3) works for previous quarter logic relative
      // Let's simplify: Last Quarter = Previous 3 months block
      const currentQuarterStart = startOfQuarter(now);
      endDate = new Date(currentQuarterStart.getTime() - 1);
      startDate = startOfQuarter(endDate);
      break;
    case "this_year":
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }

  // 1. Fetch Confirmed Events in Range
  const events = await prisma.event.findMany({
    where: {
      status: "CONFIRMED",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      recipes: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // 2. Process Data for Charts and KPIs
  let totalRevenue = 0;
  let totalCost = 0;
  
  // Daily aggregation map
  const dailyDataMap = new Map<string, { date: string; revenue: number; profit: number; cost: number }>();
  
  // Recipe performance map
  const recipePerformance = new Map<string, { name: string; revenue: number; cost: number; count: number }>();

  for (const event of events) {
    const eventRevenue = event.totalPrice;
    let eventCost = 0;

    // Calculate Event Cost based on Ingredients used in Recipes
    for (const eventRecipe of event.recipes) {
      const recipe = eventRecipe.recipe;
      // Force cast to any if types are lagging, but schema has quantity
      const servingsRatio = (eventRecipe as any).quantity || 1; 
      
      let recipeBatchCost = 0;
      for (const ri of recipe.ingredients) {
        recipeBatchCost += ri.quantity * ri.ingredient.cost;
      }
      
      const totalRecipeCostForEvent = recipeBatchCost * servingsRatio;
      eventCost += totalRecipeCostForEvent;

      // Track Recipe Performance
      const existing = recipePerformance.get(recipe.id) || { name: recipe.name, revenue: 0, cost: 0, count: 0 };
      // Estimating revenue per recipe part of the event is tricky without explicit line items.
      // We'll approximate based on cost + margin or just track usage frequency and theoretical margin.
      // Let's track theoretical margin: (Price - Cost) / Price. 
      // Since we don't store per-recipe price in Event, we use the Recipe.price * quantity as theoretical revenue
      const theoreticalRevenue = recipe.price * servingsRatio;
      
      recipePerformance.set(recipe.id, {
        name: recipe.name,
        revenue: existing.revenue + theoreticalRevenue,
        cost: existing.cost + totalRecipeCostForEvent,
        count: existing.count + 1
      });
    }

    totalRevenue += eventRevenue;
    totalCost += eventCost;

    // Add to daily map
    const dateKey = format(event.date, "yyyy-MM-dd");
    const dayStat = dailyDataMap.get(dateKey) || { date: dateKey, revenue: 0, profit: 0, cost: 0 };
    dayStat.revenue += eventRevenue;
    dayStat.cost += eventCost;
    dayStat.profit += (eventRevenue - eventCost);
    dailyDataMap.set(dateKey, dayStat);
  }

  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Fill in missing days for smooth chart
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const chartData = allDays.map((day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const data = dailyDataMap.get(dateKey);
    return {
      date: format(day, "MMM d"),
      fullDate: dateKey,
      revenue: data ? data.revenue : 0,
      profit: data ? data.profit : 0,
    };
  });

  // Calculate Top Recipes by Margin
  const topRecipes = Array.from(recipePerformance.values())
    .map(r => ({
      name: r.name,
      margin: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
      value: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0, // Using margin as value for the bar
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  return {
    kpi: {
      revenue: totalRevenue,
      profit: totalProfit,
      margin: margin,
    },
    chartData,
    topRecipes,
    periodLabel: `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`,
  };

}
