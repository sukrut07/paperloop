export function estimateImpact(weightKg: number) {
  const notebooksCreated = Math.max(1, Math.round(weightKg * 5));
  return {
    notebooksCreated,
    studentsImpacted: Math.max(1, Math.round(notebooksCreated / 3)),
    treesSavedEstimate: Number((weightKg / 60).toFixed(2)),
    waterSavedLitresEstimate: Math.round(weightKg * 26),
    co2SavedKgEstimate: Number((weightKg * 1.46).toFixed(2)),
  };
}

export function estimatePages(weightKg: number) {
  return Math.round(weightKg * 200);
}
