export const getBase64 = (file) =>
  `data:${file?.mimetype};base64,${file?.buffer.toString("base64")}`;

export const calculateTax = (amount, taxSlab) =>
  taxSlab > 0 ? (amount * taxSlab) / 100 : 0;

export function generateBookingChartData(bookings) {
  const now = new Date();

  // Define ranges
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const countInRange = (start, end) =>
    bookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date >= start && date <= end;
    }).length;

  const chartData = [
    {
      time: "yesterday",
      bookings: countInRange(oneDayAgo, now),
      fill: "var(--color-yesterday)",
    },
    {
      time: "lastWeek",
      bookings: countInRange(oneWeekAgo, now),
      fill: "var(--color-lastWeek)",
    },
    {
      time: "lastMonth",
      bookings: countInRange(oneMonthAgo, now),
      fill: "var(--color-lastMonth)",
    },
    {
      time: "last3Months",
      bookings: countInRange(threeMonthsAgo, now),
      fill: "var(--color-last3Months)",
    },
    {
      time: "last6Months",
      bookings: countInRange(sixMonthsAgo, now),
      fill: "var(--color-last6Months)",
    },
  ];

  return chartData;
}

export function generateRevenueChartData(bookings) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString("default", { month: "long" });

    // Filter bookings created in that month
    const monthRevenue = bookings
      .filter((b) => {
        const createdAt = new Date(b.createdAt);
        return (
          createdAt.getMonth() === date.getMonth() &&
          createdAt.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    months.push({
      month: monthName,
      revenue: Math.round(monthRevenue),
    });
  }

  return months;
}

export function generateVendorCarChartData(vendors, cars) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString("default", { month: "long" });

    const vendorsCount = vendors.filter((v) => {
      const createdAt = new Date(v.createdAt);
      return (
        createdAt.getMonth() === date.getMonth() &&
        createdAt.getFullYear() === date.getFullYear()
      );
    }).length;

    const carsCount = cars.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return (
        createdAt.getMonth() === date.getMonth() &&
        createdAt.getFullYear() === date.getFullYear()
      );
    }).length;

    months.push({
      month: monthName,
      vendors: vendorsCount,
      cars: carsCount,
    });
  }

  return months;
}
