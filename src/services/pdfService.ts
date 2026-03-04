import jsPDF from 'jspdf';
import { AppState } from '../types';

export async function generateStructuredPDF(state: AppState) {
  const { teamInfo, userStory, elevatorPitch, aiData } = state;
  if (!teamInfo || !userStory || !elevatorPitch || !aiData) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const addNewPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
      addNewPage();
    }
  };

  const addText = (text: string, fontSize: number, isBold: boolean = false, spacing: number = 10) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    const height = lines.length * (fontSize * 0.5);
    checkPageOverflow(height + spacing);
    doc.text(lines, margin, y);
    y += height + spacing;
  };

  const addHeader = (text: string) => {
    addText(text, 18, true, 15);
  };

  const addSubHeader = (text: string) => {
    addText(text, 14, true, 10);
  };

  // --- Title Page ---
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text("Business Model Innovation Report", margin, 60);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Team Number: ${teamInfo.teamNumber}`, margin, 80);
  doc.text(`Location: ${teamInfo.city}, ${teamInfo.prefecture}, ${teamInfo.country}`, margin, 90);
  doc.text(`Date: ${new Date().toLocaleString()}`, margin, 100);
  doc.text(`Version: 1.0.0`, margin, 110);
  
  doc.setDrawColor(90, 90, 64); // #5A5A40
  doc.setLineWidth(2);
  doc.line(margin, 120, pageWidth - margin, 120);

  addNewPage();

  // --- 1. Executive Overview ---
  addHeader("1. Executive Overview");
  addSubHeader("Investor Elevator Pitch");
  addText(aiData.investorOutput?.pitch || "", 11);
  
  addSubHeader("Strategic Vision");
  addText(userStory.desiredOutcome, 11);

  // --- 2. Problem & Opportunity ---
  addHeader("2. Problem & Opportunity");
  addSubHeader("Market Pain Points");
  addText(userStory.coreProblem, 11);
  
  addSubHeader("Market Gap");
  addText(aiData.investorOutput?.executiveSummary.problem || "", 11);
  
  addSubHeader(`Country-Specific Opportunity (${teamInfo.country})`);
  addText(elevatorPitch.context, 11);

  // --- 3. Business Model Design ---
  addHeader("3. Business Model Design");
  addSubHeader("Business Model Canvas Analysis");
  const bmc = aiData.bmc;
  if (bmc) {
    addText(`Value Proposition: ${bmc.valuePropositions}`, 10, false, 5);
    addText(`Customer Segments: ${bmc.customerSegments}`, 10, false, 5);
    addText(`Revenue Streams: ${bmc.revenueStreams}`, 10, false, 5);
    addText(`Key Partners: ${bmc.keyPartners}`, 10, false, 5);
  }
  
  addSubHeader("Value Creation Logic");
  addText(`Creates: ${aiData.valueLogic?.creates}`, 10, false, 5);
  addText(`Delivers: ${aiData.valueLogic?.delivers}`, 10, false, 5);
  addText(`Captures: ${aiData.valueLogic?.captures}`, 10, false, 5);

  // --- 4. Financial Model ---
  addHeader("4. Financial Model");
  addSubHeader("LTV / COCA Analysis");
  const fin = aiData.financials;
  if (fin) {
    const recalculatedLTV = fin.ltv.arpu * fin.ltv.margin * fin.ltv.lifetime;
    addText(`LTV: $${recalculatedLTV.toFixed(2)} (ARPU: $${fin.ltv.arpu}, Margin: ${fin.ltv.margin * 100}%, Lifetime: ${fin.ltv.lifetime} months)`, 11);
    addText(`COCA: $${fin.coca.estimatedCost}`, 11);
    const recalculatedRatio = recalculatedLTV / fin.coca.estimatedCost;
    addText(`LTV/COCA Ratio: ${recalculatedRatio.toFixed(2)} (${fin.ratio.classification})`, 11, true);
    addText(fin.ratio.interpretation, 10);
  }

  addSubHeader("5-Year Projections Summary");
  if (fin?.projections) {
    addText(`Payback Period: ${fin.projections.paybackPeriod} Months`, 11);
    addText(`ROI: ${fin.projections.roi}%`, 11);
    addText(`NPV: $${fin.projections.npv.toLocaleString()}`, 11);
  }

  // --- 5. Strategic Risk Assessment ---
  addHeader("5. Strategic Risk Assessment");
  if (fin?.projections.risks) {
    addText(`Market Uncertainty: ${fin.projections.risks.uncertainty}`, 10, false, 5);
    addText(`Regulatory Risk: ${fin.projections.risks.regulatory}`, 10, false, 5);
    addText(`Competitive Pressure: ${fin.projections.risks.competitive}`, 10, false, 5);
  }

  // --- 6. Growth Strategy ---
  addHeader("6. Growth Strategy");
  addText(aiData.investorOutput?.executiveSummary.impact || "", 11);

  // --- 7. Innovation Scorecard ---
  addHeader("7. Innovation Scorecard");
  if (aiData.scores) {
    addText(`Sustainability Score: ${aiData.scores.sustainability}/100`, 11);
    addText(`Risk Meter: ${aiData.scores.risk}/100`, 11);
    addText(`Global Scalability Index: ${aiData.scores.scalability}/100`, 11);
    addText(`AI Innovation Rating: ${aiData.scores.aiFeedback}/100`, 11);
  }

  doc.save(`Innovation_Report_Team_${teamInfo.teamNumber}_V1.pdf`);
}
