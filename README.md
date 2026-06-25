# CivicFix Crowdfund: Decentralized Public Works & Citizen Satisfaction Escrow

CivicFix Crowdfund is a decentralized micro-governance and public works crowdfunding platform. Neighbors pool funds together to hire a contractor to repair local infrastructure issues (e.g., repairing playground equipment, repaving potholes, fixing public streetlights). The locked funds are held in a secure escrow smart contract and are only released when actual citizens confirm they are satisfied with the results. 

Instead of relying on a centralized auditor or municipal authority, CivicFix uses GenLayer's decentralized AI consensus. It scraper-audits neighborhood forum discussions (Nextdoor threads, Reddit posts, or local Facebook threads) and processes public sentiment. If the consensus among validation nodes agrees that neighbors are satisfied, the funds are automatically released to the contractor.

---

## 🛠️ Tech Stack & Architecture

- **Smart Contract**: GenLayer Intelligent Contract (`contracts/civicfix.py`) featuring `web.render` web-scraping, `exec_prompt` AI audit logic, and a **Custom Consensus Validator** to verify matching satisfaction verdicts.
- **Frontend Dashboard**: Vite, React, Vanilla CSS, and `genlayer-js` with a rugged "Urban Planning Terminal" theme (high-vis orange, caution yellow, asphalt textures, blueprint grids, Bebas Neue headers, and municipal stamps).

---

## ⚡ Why CivicFix Crowdfund DIES without GenLayer

In traditional blockchain platforms (Ethereum, Solana, etc.), smart contracts are completely blind to the outside web and cannot read unstructured text. Building CivicFix on those platforms would require:
1. **Centralized Oracles**: A private server that scrapes Nextdoor or Facebook threads.
2. **Off-Chain AI Parsing**: Running a centralized Node.js or Python backend to call OpenAI APIs, parsing the sentiment, and writing the result back to the chain.

This setup is highly centralized, fragile, and prone to manipulation. If the operator's server goes down, the API key is revoked, or the operator is bribed, the escrow breaks.

**With GenLayer**, the intelligent contract itself scrapes the web thread via `gl.nondet.web.render` and performs AI sentiment auditing via `gl.nondet.exec_prompt` inside a decentralized validator network. Multiple nodes execute the audit, and they must agree on the core boolean `is_satisfied` to release the funds. CivicFix remains completely decentralized, transparent, and trustless.

---

## 🚀 Deployment & Setup Guide

### 1. Deploy the Contract on GenLayer Studio

1. Open the [GenLayer Studio](https://studio.genlayer.pm/).
2. Create a new contract file named `civicfix.py`.
3. Copy the full source code from [contracts/civicfix.py](file:///D:/Gen/CivicFix/contracts/civicfix.py) and paste it into the editor.
4. Click **Compile** to build the contract.
5. Under the Deploy tab, provide the contractor address (you can use the preset testing address: `0x9999999999999999999999999999999999999999`) and deploy the contract.
6. Copy the deployed contract address.

### 2. Configure the Frontend Environment

1. Open the [frontend/.env](file:///D:/Gen/CivicFix/frontend/.env) file.
2. Replace the placeholder address with your newly deployed contract address:
   ```env
   VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

### 3. Run the Frontend Dashboard

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open the dashboard in your browser (usually at `http://localhost:5173`).

---

## 🔬 Testing in GenLayer Studio (Web Mocking)

Since the GenLayer simulator operates in a sandboxed network, you can mock the response of the `web.render` scraper. When submitting the `audit_project_satisfaction` transaction in GenLayer Studio:

- **For Preset 1 (Satisfied)**: Provide a mock web render string containing positive citizen reviews (e.g., *"The pothole is finally fixed! Very smooth asphalt, the street is safe now. Thanks contractor!"*).
- **For Preset 2 (Unsatisfied)**: Provide a mock web render string containing complaints (e.g., *"They left garbage all over the sidewalk. Paving was uneven. Very sloppy job."*).
- **For Preset 3 (Inconclusive)**: Provide an empty string or generic unrelated text.
