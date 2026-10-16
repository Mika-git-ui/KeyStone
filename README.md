# KEYSTONE
### Simulate Failure. Understand Impact. Make Better Decisions.

**KEYSTONE** is an AI-assisted infrastructure decision-support platform designed to help businesses understand how failures in individual components can affect an entire system — before those failures happen in the real world.

Instead of relying only on manual analysis, expensive physical trials, or disconnected consulting workflows, KEYSTONE aims to provide a virtual environment where users can model infrastructure, explore failure scenarios, identify critical components, and evaluate potential mitigation strategies.

> **Our vision:** Help businesses make infrastructure decisions with greater confidence by understanding not only how a system should work, but also how it might fail.

## The Problem

Modern industrial systems depend on interconnected machines, processes, and resources. A failure in one component can create bottlenecks, reduce production, disrupt downstream operations, and increase costs.

However, understanding these dependencies before implementing a design can be difficult. Traditional analysis may require specialist expertise, extensive manual calculations, or costly physical testing.

Businesses need a practical way to ask:

- What happens if a critical machine stops working?
- Which component creates the biggest bottleneck?
- How does one failure affect the rest of the system?
- Which combination of failures poses the greatest risk?
- What changes could help maintain operations?

## Our Solution

KEYSTONE aims to make failure analysis accessible through an interactive virtual model of an infrastructure system.

Users can configure a simplified system, simulate component failures, observe their impact on overall performance, and explore possible mitigation strategies.

For the initial prototype, KEYSTONE focuses on a **production-line scenario**, where users can examine how disruptions at different stations affect throughput and identify critical bottlenecks.

The long-term vision extends beyond manufacturing to other interconnected infrastructure systems, including supply chains, software platforms, and financial infrastructure.

## Key Features

- **Virtual System Modeling:** Represent a production line through its individual stations and operational dependencies.
- **Failure Simulation:** Disable selected components to explore the effects of system disruptions.
- **Throughput Analysis:** Compare normal operation with simulated failure scenarios.
- **Bottleneck Identification:** Identify components that can significantly affect overall system performance.
- **Combined Failure Analysis:** Explore how multiple component failures can interact.
- **AI-Assisted Insights:** Provide understandable explanations of failure impacts and potential responses, where supported by the implemented analysis engine.
- **Mitigation Exploration:** Evaluate potential ways to reduce disruption and improve system resilience.
- **Interactive Interface:** Explore scenarios through a visual interface designed to make technical analysis easier to understand.

## How It Works

1. **Model:** Define the system and its components.
2. **Simulate:** Disable or degrade selected components.
3. **Analyze:** Calculate the estimated effect on system performance.
4. **Identify:** Highlight bottlenecks and high-impact failure scenarios.
5. **Mitigate:** Explore possible interventions and compare their expected effects.
6. **Decide:** Use the analysis to support more informed infrastructure decisions.

## Technology Stack

The current implementation includes:

| Layer | Technology |
|---|---|
| Frontend | React |
| Build tool | Vite |
| Styling | CSS |
| Backend API | Python, FastAPI |
| Failure analysis | Python-based simulation engine |
| Testing | Pytest |

The exact technologies used by each feature may evolve as the prototype develops.

## Project Architecture

The application separates the user interface from the simulation and analysis logic.

```text
KEYSTONE
│
├── Frontend
│   ├── Interactive system view
│   ├── Component controls
│   ├── Throughput analysis
│   └── Failure insights
│
└── Backend
    ├── FastAPI application
    ├── Failure simulation engine
    ├── Mitigation analysis engine
    └── Automated tests
```

The frontend provides the interactive experience, while the backend supports structured analysis through reusable Python modules and API endpoints.

## Getting Started

### Prerequisites

Install the following before running KEYSTONE:

- [Node.js](https://nodejs.org/)
- Python 3.11 or a compatible version
- Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd keystone
```

Replace `<YOUR_REPOSITORY_URL>` with the actual repository URL.

### 2. Start the frontend

From the project root, install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173`.

### 3. Set up the backend

Open a second terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

If the dependency file is located in the project root rather than the `backend` directory, run the installation command from the root instead.

Start the API server:

```bash
uvicorn main:app --reload
```

The API is typically available at `http://127.0.0.1:8000`, and its interactive API documentation is available at `http://127.0.0.1:8000/docs`.

**Note:** Frontend and backend commands assume the corresponding scripts, dependency files, and entry points exist in the repository. The backend must also be configured correctly for the frontend to use its API.

## Testing

KEYSTONE includes automated tests for the failure and mitigation analysis engines.

Run the backend tests from the appropriate project directory:

```bash
python -m pytest
```

To verify that the frontend can be built:

```bash
npm run build
```

These checks help identify calculation errors and prevent regressions as new functionality is introduced.

## Current Scope

KEYSTONE is being developed as a hackathon MVP, with a focus on demonstrating the core concept through a simplified production-line model.

The prototype is intended to demonstrate:

- Interactive component-level failure scenarios.
- Estimated changes in production throughput.
- Identification of important bottlenecks.
- Analysis of selected combined failures.
- Initial mitigation analysis.

The model uses simplified assumptions and should not be interpreted as a fully validated industrial digital twin.

## Roadmap

- [x] Interactive production-line prototype
- [x] Initial failure simulation engine
- [x] Automated tests for failure analysis
- [x] Initial mitigation analysis engine
- [ ] Integrate and validate all frontend and backend workflows
- [ ] Introduce configurable, evidence-based system parameters
- [ ] Expand scenario analysis and mitigation comparisons
- [ ] Incorporate reliable industrial datasets and domain-specific validation
- [ ] Explore broader infrastructure modeling capabilities

*Roadmap items represent planned work, not necessarily completed functionality.*

## Why KEYSTONE?

Most systems are evaluated based on how they are expected to perform. KEYSTONE focuses on another essential question:

**How resilient is the system when something goes wrong?**

By making failure scenarios easier to explore and their consequences easier to understand, KEYSTONE aims to help decision-makers identify vulnerabilities earlier, evaluate alternatives, and design systems that can better withstand disruption.

## Project Status

**Stage:** Hackathon MVP / Prototype

KEYSTONE is an evolving project. Its current calculations are intended for exploratory analysis and demonstration. Real-world deployment would require validated datasets, calibrated models, domain-expert review, and further testing.

## Team

Built by a student team for the **Kerala Startup Mission — She Builds Tech 3.0 AI Hackathon**.

## License

No open-source license has been specified yet. Unless a license is added to this repository, permission to reuse or redistribute the code should not be assumed.
