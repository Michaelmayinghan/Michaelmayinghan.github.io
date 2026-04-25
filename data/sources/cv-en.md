# Yinghan Ma — CV (English)

## section: profile_en
## title: Personal Profile

Yinghan Ma is an MEng Robotics & AI student at University College London (UCL), with hands-on experience in machine learning, autonomous robot navigation, embedded systems, and control theory. He co-authored and published research at DAML 2024. He is currently seeking a software engineering or AI internship to apply path-planning and LLM integration experience in a real engineering environment.

Contact: +44 7594 723656 | yinghan.ma.mike@gmail.com | yinghanma.com
GitHub: github.com/Michaelmayinghan
LinkedIn: linkedin.com/in/yinghan-ma

---

## section: education_en
## title: Education

University College London (UCL), London, UK — MEng in Robotics and Artificial Intelligence. Expected graduation: June 2029. The MEng is an integrated undergraduate-to-master programme covering robotics fundamentals, AI, control theory, and embedded systems.

---

## section: project_house_price_en
## title: Advanced Regression Framework for House Price Prediction

Year: 2024. Co-authored and published at DAML 2024.
Stack: Python, XGBoost, Feature Engineering, Pandas, Scikit-learn.

Built a complete regression pipeline on a high-dimensional dataset of 1,460 samples and 81 features. Applied one-hot encoding to 43 categorical variables and normalisation to 35 numerical features, with imputation for missing values.

Reduced multicollinearity via correlation-matrix analysis using a threshold of r > 0.8. Benchmarked four algorithms head-to-head: Linear Regression, Decision Tree, Random Forest, and XGBoost.

XGBoost delivered the best results, achieving R² = 0.9143 and MSE = 6.57 × 10⁸, outperforming all baseline models. All co-authors contributed equally to the published work.

---

## section: project_navigation_en
## title: Autonomous Robot Navigation & AI Interaction System

Year: February 2026.
Stack: Python, KD-Tree, Dijkstra, Ollama Qwen2.5, Signal Processing.

Implemented Dijkstra's algorithm with a binary min-heap (complexity O((V+E) log V)) and BFS, solving shortest-path and TSP-style multi-stop routing problems on a real-world Olympic Park map.

Built a balanced KD-Tree from scratch using recursive median-splitting. This improved nearest-neighbour query speed by 87.3% — from O(n) to O(log n) — measured empirically as 0.00522 s reduced to 0.00066 s on average.

Integrated a local LLM (Ollama Qwen2.5) for real-time natural language command parsing. The system can resolve mid-conversation intent changes from the user and trigger dynamic trajectory re-planning via Dijkstra in real time.

Processed IMU and GPS signals using trapezoidal integration and Savitzky-Golay filtering to suppress drift. Classified motion into six phases: stop, slow walk, normal, fast walk, accelerating, and turning, using empirically tuned thresholds.

---

## section: project_safe_en
## title: Smart Autonomous Security Safe System

Year: March 2026.
Stack: C/C++, Arduino Uno R4, UART, Embedded Systems.

Architected a dual-microcontroller master–slave system communicating over UART, decoupling the biometric authentication logic from the autonomous locomotion control of the chassis.

Integrated three sensing modalities for multi-modal threat detection: capacitive fingerprint sensing with DSP processing and 80-template storage, TF-Luna LiDAR for time-of-flight distance measurement with ±6 cm precision, and a NAU7802 24-bit ADC load cell for weight tampering detection.

Developed event-driven firmware where unauthorised access or weight tampering triggers a 2400 Hz alarm and autonomous tracked evasion. A door-timeout condition emits a softer 2 Hz reminder tone.

Engineered a worm-gear locking mechanism combined with encoder closed-loop feedback, providing high anti-back-drive torque and reliable verification of lock/unlock state.

---

## section: project_wind_turbine_en
## title: Wind Turbine Pitch Control System

Year: March 2026.
Stack: MATLAB, Simulink, Control Theory, State-Space Modelling.

Derived a third-order state-space model (ẋ = Ax + Bu) from first principles. The state variables capture blade pitch angle, motor angular velocity, and armature current.

Designed a lead-lag compensator that increased closed-loop bandwidth fourfold to 18.48 rad/s, while maintaining phase margin above 65° and Kv ≥ 20 to satisfy ramp steady-state error below 0.05.

Applied full state-feedback pole placement with damping ratio ζ = 0.7 and natural frequency ωn = 33.00 rad/s. Under a 10,326 V actuator saturation constraint, the peak control voltage converged at 9,815.63 V.

Achieved high-performance transient response: rise time 0.067 s, overshoot 4.36%, and zero steady-state error. Validated robustness against model uncertainty ΔG(s) = (s+5)/20 through Bode, Nyquist, and root-locus analysis.

---

## section: skills_en
## title: Technical Skills

Programming Languages: Python, C/C++ (Embedded), C#, Java, MATLAB, JavaScript, SQL.

AI & Machine Learning: XGBoost, Scikit-learn, Pandas, Feature Engineering.

LLM & Generative AI: Ollama, Qwen2.5, Prompt Engineering, Local LLM Deployment and Integration.

Robotics & Control: Modern Control Theory (State-Space, Pole Placement), Simulink, Signal Processing, Path Planning (Dijkstra, KD-Tree).

Hardware & Tools: Arduino, UART/I2C/SPI, LiDAR, 24-bit ADC, Git, Linux, LaTeX.

---

## section: additional_en
## title: Additional Information

Languages: English (IELTS 7.0), Mandarin (Native).

AP Scores: Score of 5 in Calculus BC, Physics C Mechanics, Physics 1, Computer Science A, and Macroeconomics. Score of 4 in Statistics, Environmental Science, and Microeconomics.

Competitions: Australian Mathematics Competition (AMC) — Distinction (2022), Credit (2021). Math Kangaroo — Bronze (2022).

---

## section: photography_en
## title: Photography Practice (Outside Engineering)

Beyond engineering, Yinghan is a London-based combat sports photographer. He shoots commercial work for boxing and combat sports events, and maintains personal archives of film photography (travel and journal work) and digital street photography. He believes the romance of engineering lies in turning abstract physics and algorithms into something tangible — and that reason and intuition are not opposites.
