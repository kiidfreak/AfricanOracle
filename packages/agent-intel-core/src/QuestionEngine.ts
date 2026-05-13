export interface MarketQuestion {
  question: string;
  category: string;
  horizon: string;
  suggested_prior: number;
}

export class QuestionEngine {
  /**
   * Generates a market question based on a detected signal or trend.
   */
  public generate(trend: string, category: string): MarketQuestion {
    const templates: Record<string, (t: string) => string> = {
      macro: (t) => `Will CBK respond to ${t} by raising rates next MPC meeting?`,
      agriculture: (t) => `Will ${t} lead to a maize supply shock exceeding 10%?`,
      fx: (t) => `Will USD/KES breach the 160 level due to ${t}?`,
      energy: (t) => `Will EPRA increase fuel prices following ${t}?`
    };

    const questionTemplate = templates[category] || ((t) => `Will ${t} impact market prices this quarter?`);

    return {
      question: questionTemplate(trend),
      category: category,
      horizon: '30d',
      suggested_prior: 0.5
    };
  }
}
