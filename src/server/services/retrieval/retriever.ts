export async function retrieveContext(query: string) {
  if (query.includes("營業")) {
    return [
      {
        documentTitle: "常見問題",
        score: 0.92,
        content: "營業時間為每日 10:00-20:00。"
      }
    ];
  }

  return [
    {
      documentTitle: "常見問題",
      score: 0.66,
      content: "這是暫時的 mock retrieval 結果。"
    }
  ];
}
