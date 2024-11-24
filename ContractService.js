const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 1.0,
  },
});

app.post("/generate-contract", async (req, res) => {
  const data = req.body;

  const {
    cropDetails,
    contractDetails,
    qualityControl,
    terminationClause,
    additionalInstructions,
  } = data;

  const prompt = `- Draft a detailed and lengthy legal contract in paragraph format between a farmer and a buyer in about 1200-1400 words.
    -Ensure the contract includes standard clauses for crop purchase, including quality standards, pricing, payment terms, force majeure, dispute resolution, governing law, and termination. 
    -Write the entire text in clear, professional legal language using paragraphs. 
    -Each section of the contract should flow naturally into the next paragraph. 
    -It should not contain any list or bullet points, all the things should be in sentences only.
    -The final document should be structured but readable, as though intended for real-world legal use.
    -You can include any other information in the contract that you consider important.
    - Company Details and Farmer Details will be filled by user only so use only blanks for them.
    - Input Fields:
  1. Company Details
  - Company Name: [Company Name]
  - Corporate Office Address: [Corporate Office Address]
  - Representative Name: [Representative Name]
  - Designation of Representative: [Designation of Representative]
  - Company Contact Details: [Company Contact Details]

  2. Farmer Details
  - Farmer's Name: [Farmer's Name]
  - Village: [Village]
  - Tehsil: [Tehsil]
  - District: [District]
  - State: [State]
  - Farmer's Contact Number: [Farmer's Contact Number]

  3.Crop Details:
  - Cultivation Start Date: ${cropDetails.cultivationStartDate}
  - Harvesting Method: ${cropDetails.harvestingMethod}
  - Crop Variety: ${cropDetails.cropVariety}
  - Seed Quantity: ${cropDetails.seedQuantity} kg/acre
  - Seed Value: Rs. ${cropDetails.seedValue}/acre
  - Expected Yield: ${cropDetails.expectedYield} qtl/acre

  4.Contract Details:
  - Contract Start Date: ${contractDetails.contractStartDate}
  - Contract Duration: ${contractDetails.contractDuration} months
  - Comfort Price: Rs. ${contractDetails.comfortPrice}/qtl
  - Payment Terms: ${contractDetails.paymentTerms}
  - Quality Parameters:
    - Moisture (%): ${contractDetails.qualityParameters["Moisture (%)"]}
    - Damage/Discoloration/Immature (%): ${contractDetails.qualityParameters["Damage/Discoloration/Immature (%)"]}
  5.Quality Control:
  - Inspection Method: ${qualityControl.inspectionMethod}
  - Third-Party Inspection: ${qualityControl.thirdPartyInspector}

  6.Termination Clause:
  - Notice Period: ${terminationClause.noticePeriod} days

  7.Additional Instructions:
  - ${additionalInstructions}

- The contract must be suitable for legal purposes and include all necessary protections for both parties.
`;

  try {
    // const result = await model.generateContentStream(prompt);

    let contractText = "";
    let retries = 5;
    while (retries > 0) {
      try {
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          contractText += chunkText;
        }
        return;
      } catch (error) {
        console.error("Error generating contract:", error.message);
        if (error.status === 503 && retries > 0) {
          retries -= 1;
          console.log(`Retrying... (${5 - retries} of 5)`);
          await delay(5000);
        } else {
          throw error;
        }
      }
    }
    console.error("All retries failed. Please try again later.");
    // for await (const chunk of result.stream) {
    //   const chunkText = chunk.text();
    //   contractText += chunkText;
    // }

    res.status(200).json({ contract: contractText });
  } catch (error) {
    console.error("Error generating contract:", error.message);
    res.status(500).json({ error: "Error generating contract" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
