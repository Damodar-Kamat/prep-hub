"""Background job runner so agents can stream progress to the UI (poll /api/jobs/<id>)."""
import threading
import time
import traceback
import uuid

_jobs = {}
_lock = threading.Lock()
MAX_JOBS = 200


class Job:
    def __init__(self, kind, params):
        self.id = uuid.uuid4().hex[:12]
        self.kind = kind
        self.params = params
        self.status = "running"
        self.logs = []
        self.result = None
        self.error = None
        self.started = time.time()
        self.ended = None
        self.progress = 0.0

    def log(self, msg, progress=None):
        self.logs.append({"t": round(time.time() - self.started, 2), "msg": msg})
        if progress is not None:
            self.progress = progress

    def view(self, since=0):
        return {"id": self.id, "kind": self.kind, "params": self.params, "status": self.status,
                "logs": self.logs[since:], "log_count": len(self.logs), "progress": round(self.progress, 2),
                "result": self.result if self.status != "running" else None, "error": self.error,
                "elapsed": round((self.ended or time.time()) - self.started, 1)}


def start(kind, fn, params):
    job = Job(kind, params)
    with _lock:
        if len(_jobs) > MAX_JOBS:
            for k in sorted(_jobs, key=lambda k: _jobs[k].started)[: len(_jobs) - MAX_JOBS]:
                del _jobs[k]
        _jobs[job.id] = job

    def run():
        try:
            job.result = fn(job, **params)
            job.status = "done"
            job.progress = 1.0
        except Exception as e:
            job.error = "%s: %s" % (type(e).__name__, e)
            job.log("ERROR " + job.error)
            job.log(traceback.format_exc()[-800:])
            job.status = "error"
        job.ended = time.time()

    threading.Thread(target=run, daemon=True, name="job-" + job.id).start()
    return job


def get(job_id):
    return _jobs.get(job_id)


def recent(n=30):
    return [j.view(len(j.logs)) for j in sorted(_jobs.values(), key=lambda j: -j.started)[:n]]
