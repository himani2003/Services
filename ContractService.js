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
  // Log the received data to debug
  // console.log("Received data:", data);
  const {
    companyDetails, 
    farmerDetails,
    cropDetails,
    contractDetails,
    qualityControl,
    terminationClause,
    additionalInstructions,
  } = data;

  const prompt = `- Draft a detailed legal contract in paragraph format between a farmer and a buyer in about 1500-1800 words.
    -Ensure the contract includes standard clauses for crop purchase, including quality standards, pricing, payment terms, force majeure, dispute resolution, governing law, and termination. 
    -Write the entire text in clear, professional legal language using paragraphs. 
    -Each section of the contract should flow naturally into the next paragraph. 
    -It should not contain any list or bullet points, all the things should be in sentences only.
    -The final document should be structured but readable, as though intended for real-world legal use but take information from given input fields only.
    -Generate the content like in single column only, dont but signatures or names field side by side in the end.
    - Input Fields:
  1. Company Details
  - Name: ${companyDetails.companyName}
  - Address: ${companyDetails.address}
  - Representative Name: ${companyDetails.representativeName}
  - Designation: ${companyDetails.designation}
  - Contact Details: ${companyDetails.contactDetails}

  2. Farmer Details
  - Name: ${farmerDetails.farmerName}
  - State: ${farmerDetails.state}
  - Village: ${farmerDetails.village}
  - Tehsil: ${farmerDetails.tehsil}
  - District: ${farmerDetails.district}
  - Contact Number: ${farmerDetails.contactNumber}

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
        // console.log(contractText);
        // Send the final contract text
        console.log(contractText);
        res.setHeader("Content-Type", "text/plain");
        res.status(200).send(contractText);
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

    return res.status(500).json({ error: "All retries failed. Please try again later." });
  } catch (error) {
    console.error("Error generating contract:", error.message);
    res.status(500).json({ error: "Error generating contract" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
