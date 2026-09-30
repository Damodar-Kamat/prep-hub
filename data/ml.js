/* Machine Learning & GenAI systems for engineers. */
window.STUDY_SECTIONS = window.STUDY_SECTIONS || [];
window.STUDY_SECTIONS.push({
  id: "ml",
  title: "ML & GenAI Systems",
  icon: "🤖",
  blurb: "ML fundamentals and metrics, core model families, ML system design, recommendation systems, how LLMs work, RAG architecture, and running LLM applications in production (evals, cost, agents, safety).",
  topics: [
    {
      id: "ml-fundamentals",
      title: "ML Fundamentals: Learning Setups, Bias-Variance, Metrics, Validation",
      summary: "The vocabulary and judgement every engineer needs around ML — problem framing, overfitting, evaluation metrics and avoiding leakage.",
      tags: ["ml", "metrics", "must-know"],
      brushup: [
        "Setups: <b>supervised</b> (labels: classification/regression), <b>unsupervised</b> (clustering, dimensionality reduction), <b>self-supervised</b> (LLMs), <b>reinforcement learning</b>.",
        "<b>Bias</b> (underfitting, too simple) vs <b>variance</b> (overfitting, memorizes noise); fix with model capacity, regularization (L1/L2, dropout), more data, early stopping.",
        "Split into train/validation/test (or cross-validation); time-based splits for temporal data; the test set is touched once.",
        "<b>Data leakage</b>: features that won't exist at prediction time or info from the future/test set → unrealistically good offline metrics.",
        "Classification metrics: <b>precision</b> (of predicted positives, how many right), <b>recall</b> (of actual positives, how many found), F1, ROC-AUC, PR-AUC (better for imbalanced data), log loss.",
        "Regression: MAE (robust), RMSE (penalizes large errors), MAPE.",
        "Imbalanced data: resampling, class weights, threshold tuning, PR metrics.",
        "Offline metrics must connect to online/business metrics via A/B tests.",
      ],
      detail: `
<h2>Confusion matrix</h2>
<pre><code>                 predicted +   predicted −
actual +            TP            FN
actual −            FP            TN
precision = TP / (TP + FP)      recall = TP / (TP + FN)
F1 = 2PR / (P + R)              accuracy = (TP + TN) / all   ← misleading when 99% are negative</code></pre>
<table>
<tr><th>Use case</th><th>Optimize</th><th>Why</th></tr>
<tr><td>Cancer screening, fraud detection</td><td>Recall</td><td>Missing a positive is costly</td></tr>
<tr><td>Spam filter, auto-banning</td><td>Precision</td><td>False positives anger users</td></tr>
<tr><td>Ranking/search</td><td>NDCG, MAP, recall@k</td><td>Order matters</td></tr>
</table>

<h2>Overfitting diagnosis</h2>
<pre><code>train loss ↓ and validation loss ↓   → keep training
train loss ↓ but validation loss ↑   → overfitting: regularize, more data, simpler model, early stop
both high                            → underfitting: bigger model, better features, train longer</code></pre>

<h2>Leakage examples</h2>
<ul>
<li>Predicting churn with a feature "account_closed_date".</li>
<li>Normalizing using statistics computed on the full dataset before splitting.</li>
<li>Random splits on time series (future leaks into training).</li>
<li>Duplicate users in both train and test.</li>
</ul>`,
      pitfalls: [
        "Reporting accuracy on imbalanced data.",
        "Tuning hyperparameters on the test set.",
        "Random split for temporal problems.",
        "Optimizing an offline metric uncorrelated with business value.",
      ],
      interviewQs: [
        "Explain the bias-variance trade-off.",
        "Precision vs recall — which would you optimize for fraud detection?",
        "How do you detect and prevent overfitting?",
        "What is data leakage? Give examples.",
        "How do you handle class imbalance?",
      ],
      resources: [
        { t: "Google — Machine Learning Crash Course", u: "https://developers.google.com/machine-learning/crash-course", k: "course" },
        { t: "Andrew Ng — Machine Learning Specialization", u: "https://www.coursera.org/specializations/machine-learning-introduction", k: "course" },
        { t: "Hands-On Machine Learning — Aurélien Géron", u: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/", k: "book" },
      ],
    },
    {
      id: "ml-models",
      title: "Core Model Families: Linear Models, Trees & Boosting, Neural Networks",
      summary: "What each major model family is good at, how it learns, and how to pick one for a problem.",
      tags: ["ml", "models"],
      brushup: [
        "<b>Linear/logistic regression</b>: fast, interpretable baselines; need feature engineering for non-linearity.",
        "<b>Decision trees</b>: interpretable, overfit easily. <b>Random forests</b> (bagging) reduce variance.",
        "<b>Gradient boosting</b> (XGBoost, LightGBM, CatBoost): trees fit residuals sequentially — state of the art for tabular data.",
        "<b>Neural networks</b>: learn representations; dominate images, audio, text; need lots of data and compute.",
        "CNNs (images), RNNs/LSTMs (older sequence models), <b>Transformers</b> (attention; text, vision, everything).",
        "Clustering: k-means, DBSCAN; dimensionality reduction: PCA, embeddings.",
        "Training: gradient descent, learning rate, batch size, epochs; backpropagation computes gradients.",
        "Always start with a simple baseline; complexity must beat it meaningfully.",
      ],
      detail: `
<h2>Choosing a model</h2>
<table>
<tr><th>Data / need</th><th>Start with</th></tr>
<tr><td>Tabular, structured features</td><td>Gradient boosted trees (LightGBM/XGBoost)</td></tr>
<tr><td>Need interpretability / strict latency</td><td>Logistic regression, small trees</td></tr>
<tr><td>Images</td><td>Pretrained CNN/ViT, fine-tune</td></tr>
<tr><td>Text classification / extraction</td><td>Pretrained transformer (fine-tune) or an LLM with prompting</td></tr>
<tr><td>Similarity search / recommendations</td><td>Embeddings + nearest-neighbour search</td></tr>
<tr><td>Time series forecasting</td><td>Seasonal baselines, gradient boosting with lag features, specialized models</td></tr>
</table>

<h2>Bagging vs boosting</h2>
<ul>
<li><b>Bagging</b>: train many models on bootstrap samples in parallel, average → lowers variance (random forest).</li>
<li><b>Boosting</b>: train models sequentially, each correcting predecessors' errors → lowers bias; tune learning rate, depth, number of trees; early stopping.</li>
</ul>

<h2>Gradient descent in one line</h2>
<pre><code>θ ← θ − η · ∇L(θ)       # η = learning rate; too high diverges, too low crawls
Variants: SGD, momentum, Adam (adaptive per-parameter rates)</code></pre>`,
      pitfalls: [
        "Jumping to deep learning for small tabular datasets.",
        "Not scaling features for distance/gradient-based models.",
        "No baseline to compare against.",
      ],
      interviewQs: [
        "Random forest vs gradient boosting?",
        "Why do gradient boosted trees dominate tabular data?",
        "How does backpropagation work at a high level?",
        "When would you choose logistic regression over a neural net?",
        "What is an embedding?",
      ],
      resources: [
        { t: "StatQuest (YouTube) — ML explained visually", u: "https://www.youtube.com/@statquest", k: "video" },
        { t: "scikit-learn user guide", u: "https://scikit-learn.org/stable/user_guide.html", k: "docs" },
        { t: "fast.ai — Practical Deep Learning", u: "https://course.fast.ai/", k: "course" },
      ],
    },
    {
      id: "ml-system-design",
      title: "ML System Design: Data, Features, Training, Serving, Monitoring",
      summary: "The framework for ML design interviews — from problem framing to data pipelines, feature stores, training, online serving and drift monitoring.",
      tags: ["ml", "system-design", "mlops"],
      brushup: [
        "Framework: <b>clarify objective & metric</b> → data & labels → features → model (baseline first) → training pipeline → serving → evaluation (offline + A/B) → monitoring & retraining.",
        "Labels: explicit (ratings) vs implicit (clicks, dwell); delayed labels; label noise; human labeling.",
        "<b>Feature store</b>: same feature definitions for training (offline) and serving (online) → avoid <b>training-serving skew</b>.",
        "Serving: batch predictions (precomputed) vs online (low latency); two-stage retrieval + ranking for large candidate sets.",
        "Latency tricks: caching, model distillation/quantization, approximate nearest neighbours, GPUs/batching.",
        "Monitoring: data drift, concept drift, prediction distribution, feature freshness, business KPIs; shadow deployments and canaries.",
        "Retraining cadence: scheduled or triggered by drift; reproducible pipelines with versioned data/models (MLflow).",
        "Fairness, privacy and feedback loops (models influencing their own future training data).",
      ],
      detail: `
<h2>Reference architecture</h2>
<pre><code>events/logs ─► stream (Kafka) ─► feature pipelines (Flink/Spark) ─► feature store (online: Redis/DynamoDB, offline: lakehouse)
                                                                             │                 │
labels ─► training data builder (point-in-time joins) ─► training (GPU) ─► model registry ─► serving (REST/gRPC)
                                                                                                │
monitoring: drift, latency, KPIs ◄──────────── prediction logs ◄───────────────────────────────┘</code></pre>

<h2>Point-in-time correctness</h2>
<p>When building training rows, each feature must use only data available <b>at the prediction timestamp</b>. Joining today's feature values to last month's labels leaks the future.</p>

<h2>Worked prompt: "Design a fraud detection system"</h2>
<ol>
<li>Objective: block fraudulent card transactions; metric: recall at a fixed false-positive rate, $ loss prevented; latency budget &lt; 100 ms.</li>
<li>Labels: chargebacks (delayed weeks), analyst reviews.</li>
<li>Features: transaction amount, merchant risk, velocity (txns per card in 1h/24h — streaming aggregates), device/IP reputation, distance from usual location.</li>
<li>Model: rules as baseline + gradient boosted trees; graph features for fraud rings later.</li>
<li>Serving: online scoring in the payment path; thresholds → approve / challenge (3DS) / decline; fallback to rules if the model is down.</li>
<li>Monitoring: fraud rate, decline rate, drift in feature distributions; retrain weekly; adversarial adaptation.</li>
</ol>`,
      pitfalls: [
        "Training-serving skew from separately implemented feature logic.",
        "No fallback when the model service fails.",
        "Ignoring label delay when evaluating fresh models.",
        "Only monitoring system metrics, not model quality.",
      ],
      interviewQs: [
        "Walk me through designing an ML system end to end.",
        "What is training-serving skew and how do you prevent it?",
        "Batch vs online inference — trade-offs?",
        "How do you monitor a model in production?",
        "Design a fraud detection / ETA prediction / spam filter system.",
      ],
      resources: [
        { t: "Designing Machine Learning Systems — Chip Huyen", u: "https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/", k: "book" },
        { t: "Machine Learning System Design Interview — Ali Aminian & Alex Xu", u: "https://bytebytego.com/intro/machine-learning-system-design-interview", k: "book" },
        { t: "Google — Rules of Machine Learning", u: "https://developers.google.com/machine-learning/guides/rules-of-ml", k: "article" },
      ],
    },
    {
      id: "recsys",
      title: "Recommendation & Search Ranking Systems",
      summary: "How feeds, product recommendations and search results are generated at scale — candidate generation, ranking, embeddings and evaluation.",
      tags: ["recommendations", "ranking", "embeddings"],
      brushup: [
        "Two/three-stage funnel: <b>candidate generation</b> (thousands from millions, cheap) → <b>ranking</b> (hundreds, rich model) → <b>re-ranking</b> (diversity, business rules, freshness).",
        "Candidate sources: collaborative filtering, item-to-item similarity, <b>two-tower embeddings</b> + ANN search, popular/trending, social graph.",
        "Collaborative filtering (users who liked X liked Y) vs content-based (item features); hybrids handle cold start.",
        "Ranking model predicts engagement probabilities (click, watch time, purchase) from user, item and context features; combine into a score.",
        "<b>ANN</b> indexes (HNSW, IVF, ScaNN, FAISS) for fast vector search.",
        "Cold start: popularity, content features, onboarding questions, exploration (bandits).",
        "Evaluation: offline (recall@k, NDCG, AUC) → online A/B (CTR, retention, revenue); watch feedback loops and popularity bias.",
      ],
      detail: `
<h2>Architecture</h2>
<pre><code>request(user, context)
  → candidate generators (parallel): two-tower ANN (500), co-visitation (300), trending (100), follows (200)
  → dedupe + filter (seen, blocked, out of stock)
  → ranker (GBDT or deep model) scores ~1000 items with ~hundreds of features   [&lt; 50 ms]
  → re-rank: diversity, freshness boosts, ads/business constraints
  → top 20 → log impressions for training</code></pre>

<h2>Two-tower model</h2>
<p>User tower encodes user features → vector u; item tower encodes item features → vector v; trained so dot(u, v) is high for engaged pairs. Item vectors are precomputed and indexed in an ANN index; at request time compute u and retrieve nearest items.</p>`,
      pitfalls: [
        "Optimizing CTR only → clickbait; balance with long-term metrics.",
        "No exploration → rich-get-richer popularity loops.",
        "Training on logged data without accounting for position bias.",
      ],
      interviewQs: [
        "Design YouTube/Netflix/Amazon recommendations.",
        "Why split into candidate generation and ranking?",
        "How do you handle cold start?",
        "Collaborative filtering vs content-based filtering?",
        "How do you evaluate a recommender offline and online?",
      ],
      resources: [
        { t: "Deep Neural Networks for YouTube Recommendations (paper)", u: "https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/", k: "paper" },
        { t: "Eugene Yan — RecSys & search design patterns", u: "https://eugeneyan.com/writing/system-design-for-discovery/", k: "blog" },
        { t: "FAISS", u: "https://github.com/facebookresearch/faiss", k: "repo" },
      ],
    },
    {
      id: "llm-fundamentals",
      title: "How LLMs Work: Tokens, Transformers, Training, Inference",
      summary: "The mechanics behind large language models that engineers need — tokenization, attention, pretraining and fine-tuning, and what drives inference cost and latency.",
      tags: ["llm", "genai", "transformers"],
      brushup: [
        "Text → <b>tokens</b> (subword units) → embeddings; the model predicts the next token probability distribution; generation samples tokens one at a time.",
        "<b>Transformer</b>: stacked self-attention + feed-forward layers; attention lets each token weigh all previous tokens; cost grows with context length.",
        "Training stages: <b>pretraining</b> (next-token on huge corpora) → <b>instruction tuning/SFT</b> → <b>preference tuning</b> (RLHF/DPO) for helpfulness and safety.",
        "Adapting: prompting/few-shot → <b>RAG</b> (add knowledge) → fine-tuning / LoRA (change behaviour/format) — try in that order.",
        "Inference: prefill (process prompt, parallel) + decode (one token at a time, memory-bandwidth bound); <b>KV cache</b> stores past attention keys/values.",
        "Latency ≈ time to first token + tokens × time per token; cost ∝ input + output tokens.",
        "Sampling: temperature, top-p; lower temperature for deterministic tasks.",
        "Limitations: hallucination, context window limits, knowledge cutoff, prompt injection.",
      ],
      detail: `
<h2>Attention in one formula</h2>
<pre><code>Attention(Q, K, V) = softmax(Q Kᵀ / √d) V
Each token's query is compared with every key → weights → weighted sum of values.
Multi-head attention runs this in parallel subspaces; causal masking hides future tokens.</code></pre>

<h2>Customization ladder</h2>
<table>
<tr><th>Technique</th><th>Changes</th><th>Cost</th></tr>
<tr><td>Prompt engineering / few-shot</td><td>Instructions, format</td><td>Minutes</td></tr>
<tr><td>RAG</td><td>Knowledge available at answer time</td><td>Days; needs retrieval infra</td></tr>
<tr><td>Fine-tuning (LoRA/full)</td><td>Style, format, narrow skills</td><td>Data + training + eval</td></tr>
<tr><td>Pretraining</td><td>Everything</td><td>Enormous</td></tr>
</table>

<h2>Serving efficiency</h2>
<ul>
<li>Continuous batching, paged KV cache (vLLM), speculative decoding, quantization (8/4-bit), prompt caching of shared prefixes.</li>
<li>Smaller/distilled models for simple tasks; route hard queries to larger models.</li>
<li>Stream tokens to the user (SSE) to cut perceived latency.</li>
</ul>`,
      pitfalls: [
        "Fine-tuning to add factual knowledge (use RAG).",
        "Ignoring token costs of long prompts and conversation history.",
        "Treating model output as trusted input to other systems.",
      ],
      interviewQs: [
        "How does a transformer-based LLM generate text?",
        "What is the KV cache?",
        "Prompting vs RAG vs fine-tuning — how do you choose?",
        "What drives LLM latency and cost?",
        "What is temperature?",
      ],
      resources: [
        { t: "Andrej Karpathy — Intro to Large Language Models (talk)", u: "https://www.youtube.com/watch?v=zjkBMFhNj_g", k: "video" },
        { t: "The Illustrated Transformer — Jay Alammar", u: "https://jalammar.github.io/illustrated-transformer/", k: "article" },
        { t: "Attention Is All You Need (paper)", u: "https://arxiv.org/abs/1706.03762", k: "paper" },
      ],
    },
    {
      id: "rag",
      title: "RAG Architecture: Chunking, Embeddings, Vector Search, Reranking",
      summary: "Designing retrieval-augmented generation systems that answer from your own data accurately — and how to evaluate them.",
      tags: ["rag", "llm", "vector-db", "must-know"],
      brushup: [
        "Pipeline: <b>ingest</b> (parse, clean) → <b>chunk</b> → <b>embed</b> → index; at query time: embed query → <b>retrieve</b> → <b>rerank</b> → build prompt with context → generate with citations.",
        "Chunking: semantic/structure-aware (headings, paragraphs), 200–800 tokens with overlap; keep metadata (source, section, permissions, date).",
        "<b>Hybrid search</b>: dense vectors (semantic) + BM25/keyword (exact terms, IDs) merged with RRF.",
        "<b>Rerankers</b> (cross-encoders) reorder the top ~50 for precision.",
        "Query transformation: rewriting, multi-query, HyDE, decomposition for multi-hop questions.",
        "Vector stores: pgvector, OpenSearch, Pinecone, Weaviate, Qdrant, Milvus; ANN (HNSW) trade recall vs latency.",
        "Enforce <b>access control</b> at retrieval (filter by user permissions) — never rely on the prompt.",
        "Evaluate retrieval (recall@k, MRR) and generation (faithfulness/groundedness, answer relevance) with a golden dataset + LLM-as-judge.",
      ],
      detail: `
<h2>Architecture</h2>
<pre><code>Docs (Confluence, PDFs, tickets) ─► parser ─► chunker ─► embedder ─► vector index + keyword index (+ ACL metadata)
                                                                              ▲
User question ─► query rewrite ─► hybrid retrieve (k=50) ─► permission filter ─► rerank (top 5) ─► prompt:
   "Answer using only the context. Cite sources [n]. If unsure, say you don't know."  ─► LLM ─► answer + citations</code></pre>

<h2>Failure modes and fixes</h2>
<table>
<tr><th>Symptom</th><th>Fix</th></tr>
<tr><td>Right doc exists but not retrieved</td><td>Hybrid search, better chunking, query rewriting, metadata filters</td></tr>
<tr><td>Retrieved but answer wrong</td><td>Reranking, fewer/better chunks, stronger instructions, bigger model</td></tr>
<tr><td>Hallucinated facts</td><td>Require citations, groundedness checks, "I don't know" allowed</td></tr>
<tr><td>Stale answers</td><td>Incremental re-indexing via CDC/webhooks, dates in metadata</td></tr>
<tr><td>Data leak across users</td><td>ACL filtering at retrieval time</td></tr>
</table>

<h2>Evaluation loop</h2>
<ol>
<li>Build 100–500 real questions with expected sources/answers.</li>
<li>Measure retrieval recall@k and answer faithfulness/correctness per change (chunk size, embedding model, k, reranker).</li>
<li>Track online signals: thumbs up/down, citation clicks, escalations.</li>
</ol>`,
      pitfalls: [
        "Fixed-size chunks that split tables and sentences mid-way.",
        "Pure vector search failing on exact identifiers (error codes, SKUs).",
        "Stuffing too many chunks → 'lost in the middle' and higher cost.",
        "No evaluation set — tuning by vibes.",
      ],
      interviewQs: [
        "Design a RAG system over company documents.",
        "How do you choose chunk size?",
        "Why use hybrid search and reranking?",
        "How do you evaluate a RAG pipeline?",
        "How do you enforce document permissions in RAG?",
      ],
      resources: [
        { t: "Anthropic — Contextual Retrieval", u: "https://www.anthropic.com/news/contextual-retrieval", k: "article" },
        { t: "pgvector", u: "https://github.com/pgvector/pgvector", k: "repo" },
        { t: "Pinecone learning center — RAG", u: "https://www.pinecone.io/learn/retrieval-augmented-generation/", k: "article" },
      ],
    },
    {
      id: "llm-production",
      title: "LLM Apps in Production: Evals, Agents, Guardrails, Cost & Latency",
      summary: "Engineering reliable LLM features — evaluation, structured outputs, tool use and agents, prompt-injection defences, observability and cost control.",
      tags: ["llm", "agents", "evals"],
      brushup: [
        "Treat prompts as code: version them, test them, evaluate changes against a dataset before shipping.",
        "<b>Evals</b>: deterministic checks (format, schema), reference-based scoring, LLM-as-judge with rubrics, human review for samples.",
        "<b>Structured outputs</b> (JSON schema / tool calling) for anything a program consumes; validate and retry.",
        "<b>Agents</b> = LLM + tools in a loop (plan → act → observe). Keep tools narrow, add step limits, timeouts, and human approval for risky actions.",
        "<b>Prompt injection</b>: untrusted content (web pages, emails, docs) can contain instructions — isolate it, restrict tool permissions, never let model output directly trigger sensitive actions.",
        "Guardrails: input/output moderation, PII redaction, allowlisted actions, grounding checks.",
        "Cost/latency: smaller models for easy steps, caching (prompt + semantic), batching, streaming, limit context growth.",
        "Observability: trace every call (prompt, response, tokens, latency, tool calls) and link to user feedback.",
      ],
      detail: `
<h2>Minimal agent loop</h2>
<pre><code>messages = [system_prompt, user_request]
for step in range(MAX_STEPS):
    reply = llm(messages, tools=TOOLS)
    if reply.tool_call is None:
        return reply.text
    if reply.tool_call.name in SENSITIVE and not user_approved(reply.tool_call):
        messages.append(tool_result("denied by user")); continue
    result = run_tool(reply.tool_call, timeout=10)          # validated args, least-privilege credentials
    messages.append(tool_result(truncate(result)))
return "Stopped: step limit reached"</code></pre>

<h2>Eval-driven development</h2>
<table>
<tr><th>Layer</th><th>Example check</th></tr>
<tr><td>Unit</td><td>Output parses as the JSON schema; required fields present</td></tr>
<tr><td>Task quality</td><td>Accuracy vs labelled set; LLM judge with rubric</td></tr>
<tr><td>Safety</td><td>Red-team prompts, injection test suite, refusal behaviour</td></tr>
<tr><td>Online</td><td>Feedback rate, task completion, escalations, cost per task</td></tr>
</table>

<h2>Prompt injection defence in depth</h2>
<ul>
<li>Separate trusted instructions from untrusted data; label and delimit retrieved content.</li>
<li>Least-privilege tools; read-only by default; confirmations for writes, payments, messages.</li>
<li>Don't render model output as HTML or execute it without sanitization.</li>
<li>Monitor for exfiltration patterns (URLs with data, unexpected tool sequences).</li>
</ul>`,
      pitfalls: [
        "Shipping prompt changes without regression evals.",
        "Agents with broad credentials and no step limits.",
        "Letting retrieved web/email content act as instructions.",
        "Unbounded conversation history → rising cost and latency.",
      ],
      interviewQs: [
        "How do you evaluate an LLM feature?",
        "What is prompt injection and how do you defend against it?",
        "Design an AI support agent that can issue refunds.",
        "How do you reduce LLM latency and cost?",
        "When would you use an agent vs a fixed workflow?",
      ],
      resources: [
        { t: "Anthropic — Building effective agents", u: "https://www.anthropic.com/engineering/building-effective-agents", k: "article" },
        { t: "OWASP Top 10 for LLM Applications", u: "https://genai.owasp.org/llm-top-10/", k: "docs" },
        { t: "Hamel Husain — Your AI product needs evals", u: "https://hamel.dev/blog/posts/evals/", k: "blog" },
        { t: "AI Engineering — Chip Huyen", u: "https://www.oreilly.com/library/view/ai-engineering/9781098166298/", k: "book" },
      ],
    },
  ],
});
