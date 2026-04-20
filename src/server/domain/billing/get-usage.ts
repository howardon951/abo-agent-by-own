export async function getUsageReport() {
  return {
    items: [
      {
        tenant: "Abo Coffee",
        messagesToday: 42,
        tokensToday: 12000,
        estimatedCost: 0.82,
        handoffs: 3
      },
      {
        tenant: "Demo Salon",
        messagesToday: 88,
        tokensToday: 31000,
        estimatedCost: 1.97,
        handoffs: 7
      }
    ]
  };
}
