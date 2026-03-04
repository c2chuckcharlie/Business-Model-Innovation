export type Language = 'en' | 'zh' | 'ja';

export interface TeamInfo {
  teamNumber: string;
  country: string;
  prefecture: string;
  city: string;
  town: string;
}

export interface UserStory {
  targetUser: string;
  coreProblem: string;
  solutionSummary: string;
  desiredOutcome: string;
}

export interface ElevatorPitch {
  targetSegment: string;
  context: string;
  productDescription: string;
  coreValueProp: string;
  differentiation: string;
  competitiveAdvantage: string;
  pitchText: string;
}

export interface BMC {
  customerSegments: string;
  valuePropositions: string;
  channels: string;
  customerRelationships: string;
  revenueStreams: string;
  keyActivities: string;
  keyResources: string;
  keyPartners: string;
  costStructure: string;
}

export interface ValueLogic {
  creates: string;
  delivers: string;
  captures: string;
}

export interface Financials {
  ltv: {
    explanation: string;
    arpu: number;
    margin: number;
    lifetime: number;
    total: number;
    breakdown: string;
  };
  coca: {
    definition: string;
    assumptions: string;
    estimatedCost: number;
  };
  ratio: {
    value: number;
    classification: 'Healthy' | 'Moderate' | 'Risky';
    interpretation: string;
  };
  projections: {
    assumptions: {
      firstYearUsers: number;
      growthRate: number;
      churnRate: number;
      marketingBudget: number;
      operatingCost: number;
    };
    fiveYearCashFlow: { year: number; revenue: number; cost: number; profit: number }[];
    paybackPeriod: number;
    roi: number;
    npv: number;
    risks: {
      uncertainty: string;
      regulatory: string;
      competitive: string;
      sensitivity: string;
    };
  };
}

export interface InvestorOutput {
  pitch: string;
  executiveSummary: {
    problem: string;
    solution: string;
    market: string;
    businessModel: string;
    financialViability: string;
    competitiveAdvantage: string;
    impact: string;
  };
}

export interface AppState {
  language: Language;
  step: number;
  teamInfo: TeamInfo | null;
  userStory: UserStory | null;
  elevatorPitch: ElevatorPitch | null;
  aiData: {
    bmc: BMC | null;
    valueLogic: ValueLogic | null;
    financials: Financials | null;
    investorOutput: InvestorOutput | null;
    scores: {
      sustainability: number;
      risk: number;
      scalability: number;
      aiFeedback: number;
    } | null;
  };
  isGenerating: boolean;
}
