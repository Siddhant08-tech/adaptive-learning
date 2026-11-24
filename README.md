# 🌱 GreenML: Carbon-Aware ML Framework

A Python framework that **measures the electricity used by machine-learning runs, converts it to CO₂e using India's grid emission factor, ranks models by a Carbon Efficiency Score, and tests techniques that cut energy with little accuracy loss.**

**Team GreenByte** · Minor Project · Shivalik College of Engineering, Dehradun
**Guide:** Dr. Varun Sapra (HoD, CSE)
**Team:** Siddhant Shekhar, Yash Raj, Manya Rawat, Vishal Kumar

---

## Why this project?

ML papers and tutorials report accuracy but never the energy and carbon cost of a run. Most of India's electricity still comes from coal, so every training run has a real carbon footprint. Existing tools such as CodeCarbon report a number, but they don't rank models, suggest optimisations, or focus on the Indian grid. GreenML fills that gap.

```
CO₂e (g) = Energy (kWh) × Grid factor (kg CO₂/kWh) × 1000
```

## Features

- **Energy profiler:** samples CPU load every 100 ms (plus RAM and NVIDIA GPU power if available)
- **Carbon estimator:** converts kWh to g CO₂e using a configurable India grid factor (default 0.75)
- **Carbon Efficiency Score (CES):** accuracy % per gram of CO₂e, to rank models by how green they are
- **Benchmark:** 6 models × 3 datasets, with repeated trials
- **Optimizer:** tests 5 green techniques and recommends the best per model
- **Carbon-aware scheduler:** suggests a cleaner start time for flexible jobs
- **Wattmeter validation:** compares estimates with real hardware readings
- **Streamlit dashboard:** charts, rankings and recommendations
- **SQLite experiment log** and unit tests

## Architecture

```
ML workload → Profiler → Carbon Estimator → Experiment DB (SQLite)
                                               │
                    Analyzer (CES, ranking) ◄──┼──► Optimizer (techniques, advice)
                                               │
                              Dashboard (Streamlit) + Scheduler + Validation
```

## Quick start (Windows)

```powershell
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Set your CPU's rated power (TDP, in watts) for accurate readings
$env:GREENML_CPU_TDP=28

python run.py benchmark --trials 3      # measure and rank 6 models on 3 datasets
python run.py optimize --trials 3       # test green techniques against the baseline
python run.py report                    # print the stored results
streamlit run dashboard/app.py          # open the dashboard
python -m unittest discover -s tests    # run the tests
```

On macOS/Linux, activate with `source .venv/bin/activate` and set the TDP with `export GREENML_CPU_TDP=28`.
Requires Python 3.10+.

### Configuration

| Variable | Meaning | Default |
|---|---|---|
| `GREENML_CPU_TDP` | Your CPU's rated power in watts | 65 |
| `GREENML_GRID_FACTOR` | Grid emission factor in kg CO₂/kWh (CEA data) | 0.75 |

## Models, datasets and techniques

- **Models:** Logistic Regression, KNN, SVM, Random Forest, Gradient Boosting, MLP
- **Datasets:** breast cancer (569×30), digits (1,797×64), synthetic large (8,000×30)
- **Green techniques:** fewer trees, early stopping, smaller network, PCA (95% variance), 50% data subsample

## Preliminary results

*Single-trial run on a laptop (CPU rated at 28 W). Final numbers will use 5 trials with mean ± standard deviation.*

**Model comparison:** accuracy was similar, but energy was not. On the digits dataset, Gradient Boosting used about 1,170× more energy than KNN (3.1×10⁻⁵ kWh vs 2.6×10⁻⁸ kWh) for almost the same accuracy (96.1% vs 96.4%). Overall ranking by mean CES rank: KNN, Logistic Regression, SVM, Random Forest, MLP, Gradient Boosting.

**Optimisation:** the target is ≥20% energy saving with ≤2 percentage points of accuracy loss. For 15 of the 18 model/dataset pairs, at least one technique met it.

| Technique | Model | Energy saving | Accuracy change |
|---|---|---|---|
| Early stopping | MLP | 65–84% | −0.3 to 0 pp |
| Fewer trees | Random Forest | about 70% | −0.3 to 0 pp |
| Fewer trees | Gradient Boosting | about 60% | −0.8 to 0 pp (misses the 2 pp limit on the synthetic set) |
| 50% data | SVM | 22–63% | −1.9 to 0 pp |

PCA often *increased* energy on these small datasets, because the decomposition costs more than the training it saves.

## Project structure

```
├── README.md
├── PROJECT_PLAN.md        plan, timeline, roles
├── requirements.txt
├── run.py                 command-line interface
├── greenml/
│   ├── config.py          grid factor, TDP, targets
│   ├── profiler.py        energy measurement
│   ├── estimator.py       energy → CO₂e, CES
│   ├── database.py        SQLite experiment log
│   ├── datasets.py        3 benchmark datasets
│   ├── models.py          6 models + 5 green techniques
│   ├── analyzer.py        benchmark runner, ranking, Pareto front
│   ├── optimizer.py       technique comparison, recommendations
│   ├── scheduler.py       carbon-aware scheduling
│   ├── validation.py      wattmeter comparison
│   └── dl_experiments.py  optional PyTorch experiments
├── dashboard/app.py       Streamlit dashboard
└── tests/test_core.py     unit tests
```

## How measurement works

- Power is estimated as `TDP × (0.3 + 0.7 × CPU utilisation)`, plus RAM (0.375 W/GB) and GPU power if present.
- Energy = power × time, converted to kWh.
- Fast models are repeated inside the measurement window until it lasts at least 1 second, then energy is divided by the repeat count.
- Each combination is measured over several independent trials and averaged.
- CodeCarbon can be used as a cross-check: `python run.py benchmark --backend codecarbon` (requires `pip install codecarbon`).

## Limitations

- Power is **estimated** from CPU utilisation and TDP, not read from a hardware counter. Wattmeter validation is in progress.
- The hourly grid pattern in the scheduler is illustrative and will be replaced with real data.
- The benchmark datasets are small, so accuracy changes come in coarse steps (one test sample = 0.28–0.88 pp on the two small sets).
- Close other applications while measuring, because background load inflates readings.

## Roadmap

- [x] Profiler, estimator, database
- [x] Benchmark across 6 models and 3 datasets
- [x] Optimisation experiments
- [x] Dashboard
- [ ] Wattmeter validation and calibration
- [ ] Final experiments (5 trials each)
- [ ] Deep-learning experiments with PyTorch
- [ ] Real hourly carbon-intensity data for the scheduler

## References

- CodeCarbon: https://github.com/mlco2/codecarbon
- Central Electricity Authority (CEA), *CO₂ Baseline Database for the Indian Power Sector*

## License

<Add a license such as MIT, or remove this section.>
