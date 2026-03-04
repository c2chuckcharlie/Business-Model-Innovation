import { GoogleGenAI, Type } from "@google/genai";
import { UserStory, ElevatorPitch, TeamInfo, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateBusinessModel(
  language: Language,
  teamInfo: TeamInfo,
  userStory: UserStory,
  elevatorPitch: ElevatorPitch,
  currentData?: any
) {
  const langMap = {
    en: "English",
    zh: "Traditional Chinese",
    ja: "Japanese"
  };

  const systemInstruction = `
    You are an expert startup consultant and venture capitalist.
    Generate a comprehensive business model analysis in English based on the provided user story and elevator pitch.
    IMPORTANT: Even if the input is in another language, the output MUST be in English to ensure international compatibility for the final report.
    The business is located in ${teamInfo.city}, ${teamInfo.prefecture}, ${teamInfo.country}.
    
    Ensure all financial calculations are realistic and consistent.
    LTV = ARPU * Gross Margin * Customer Lifetime.
    COCA calculation must be justified.
    The ratio LTV/COCA should be calculated.
    5-year projections must include cash flow, ROI, NPV, and payback period.
    
    Return the response in strict JSON format.
  `;

  const prompt = `
    Team Info: ${JSON.stringify(teamInfo)}
    User Story: ${JSON.stringify(userStory)}
    Elevator Pitch: ${JSON.stringify(elevatorPitch)}
    ${currentData ? `Current Draft (please refine and improve based on these edits): ${JSON.stringify(currentData)}` : ''}
    
    Generate the following sections:
    1. Business Model Canvas (9 blocks)
    2. Value Creation Logic (Creates, Delivers, Captures)
    3. LTV Analysis (Explanation, ARPU, Margin, Lifetime, Total, Breakdown)
    4. COCA Analysis (Definition, Assumptions, Estimated Cost)
    5. LTV/COCA Ratio & Interpretation
    6. 5-Year Financial Projections (Assumptions, Cash Flow Table, Payback, ROI, NPV, Risks)
    7. Investor Ready Output (Elevator Pitch, Executive Summary)
    8. Gamification Scores (Sustainability, Risk, Scalability, AI Feedback - all 0-100)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bmc: {
            type: Type.OBJECT,
            properties: {
              customerSegments: { type: Type.STRING },
              valuePropositions: { type: Type.STRING },
              channels: { type: Type.STRING },
              customerRelationships: { type: Type.STRING },
              revenueStreams: { type: Type.STRING },
              keyActivities: { type: Type.STRING },
              keyResources: { type: Type.STRING },
              keyPartners: { type: Type.STRING },
              costStructure: { type: Type.STRING }
            },
            required: ["customerSegments", "valuePropositions", "channels", "customerRelationships", "revenueStreams", "keyActivities", "keyResources", "keyPartners", "costStructure"]
          },
          valueLogic: {
            type: Type.OBJECT,
            properties: {
              creates: { type: Type.STRING },
              delivers: { type: Type.STRING },
              captures: { type: Type.STRING }
            },
            required: ["creates", "delivers", "captures"]
          },
          financials: {
            type: Type.OBJECT,
            properties: {
              ltv: {
                type: Type.OBJECT,
                properties: {
                  explanation: { type: Type.STRING },
                  arpu: { type: Type.NUMBER },
                  margin: { type: Type.NUMBER },
                  lifetime: { type: Type.NUMBER },
                  total: { type: Type.NUMBER },
                  breakdown: { type: Type.STRING }
                },
                required: ["explanation", "arpu", "margin", "lifetime", "total", "breakdown"]
              },
              coca: {
                type: Type.OBJECT,
                properties: {
                  definition: { type: Type.STRING },
                  assumptions: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER }
                },
                required: ["definition", "assumptions", "estimatedCost"]
              },
              ratio: {
                type: Type.OBJECT,
                properties: {
                  value: { type: Type.NUMBER },
                  classification: { type: Type.STRING },
                  interpretation: { type: Type.STRING }
                },
                required: ["value", "classification", "interpretation"]
              },
              projections: {
                type: Type.OBJECT,
                properties: {
                  assumptions: {
                    type: Type.OBJECT,
                    properties: {
                      firstYearUsers: { type: Type.NUMBER },
                      growthRate: { type: Type.NUMBER },
                      churnRate: { type: Type.NUMBER },
                      marketingBudget: { type: Type.NUMBER },
                      operatingCost: { type: Type.NUMBER }
                    }
                  },
                  fiveYearCashFlow: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        year: { type: Type.NUMBER },
                        revenue: { type: Type.NUMBER },
                        cost: { type: Type.NUMBER },
                        profit: { type: Type.NUMBER }
                      }
                    }
                  },
                  paybackPeriod: { type: Type.NUMBER },
                  roi: { type: Type.NUMBER },
                  npv: { type: Type.NUMBER },
                  risks: {
                    type: Type.OBJECT,
                    properties: {
                      uncertainty: { type: Type.STRING },
                      regulatory: { type: Type.STRING },
                      competitive: { type: Type.STRING },
                      sensitivity: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          investorOutput: {
            type: Type.OBJECT,
            properties: {
              pitch: { type: Type.STRING },
              executiveSummary: {
                type: Type.OBJECT,
                properties: {
                  problem: { type: Type.STRING },
                  solution: { type: Type.STRING },
                  market: { type: Type.STRING },
                  businessModel: { type: Type.STRING },
                  financialViability: { type: Type.STRING },
                  competitiveAdvantage: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            }
          },
          scores: {
            type: Type.OBJECT,
            properties: {
              sustainability: { type: Type.NUMBER },
              risk: { type: Type.NUMBER },
              scalability: { type: Type.NUMBER },
              aiFeedback: { type: Type.NUMBER }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateFinalReport(
  language: Language,
  teamInfo: TeamInfo,
  userStory: UserStory,
  elevatorPitch: ElevatorPitch,
  aiData: any
) {
  const langMap = {
    en: "English",
    zh: "Traditional Chinese",
    ja: "Japanese"
  };

  const systemInstruction = `
    You are a professional business analyst. 
    Synthesize all the provided information into a final, comprehensive Business Model Innovation Report in English.
    The report MUST be in English regardless of the UI language.
    The report should be professional, investor-ready, and internally consistent.
    Follow this exact structure:
    # Business Model Innovation Report
    ## Executive Overview
    - Investor elevator pitch
    - Strategic vision
    - Innovation thesis
    ## Problem & Opportunity
    - Market pain points
    - Market gap
    - Country-specific opportunity (${teamInfo.country})
    ## Business Model Design
    - Full Business Model Canvas analysis
    - Value creation logic
    - Competitive positioning
    ## Financial Model
    - LTV/COCA Analysis
    - 5-year projections summary
    - Payback period, ROI, and NPV
    - Risk analysis
    ## Strategic Risk Assessment
    - Market, Regulatory, Operational, and Competitive risks
    ## Growth Strategy
    - Scaling and expansion plans
    ## Innovation Scorecard
    - Sustainability, Scalability, and AI Innovation ratings
  `;

  const prompt = `
    Team Info: ${JSON.stringify(teamInfo)}
    User Story: ${JSON.stringify(userStory)}
    Elevator Pitch: ${JSON.stringify(elevatorPitch)}
    AI Generated Data: ${JSON.stringify(aiData)}
    
    Generate a full markdown report.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  return response.text;
}
