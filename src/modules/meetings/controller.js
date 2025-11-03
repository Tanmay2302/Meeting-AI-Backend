
import {
  createMeeting,
  listMeetings,
  getMeeting,
  forceSummarize,
} from "./service.js";

export async function postMeeting(req, res, next) {
  try {
    const { title, transcript } = req.body || {};
    if (!title || !transcript)
      return res.status(400).json({ error: "title & transcript are required" });

    const out = await createMeeting({ title, transcript });
    res.status(out.processing ? 202 : 200).json(out.meeting);
  } catch (e) {
    next(e);
  }
}

export async function getMeetings(req, res, next) {
  try {
    const data = await listMeetings({ limit: Number(req.query.limit) || 20 });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function getMeetingById(req, res, next) {
  try {
    const auto = ["1", "true", "yes"].includes(
      String(req.query.auto || "").toLowerCase()
    );
    const item = await getMeeting(req.params.id, { auto });
    if (!item) return res.status(404).json({ error: "not found" });
    res.json(item);
  } catch (e) {
    next(e);
  }
}

export async function postForceSummarize(req, res, next) {
  try {
    const updated = await forceSummarize(req.params.id);
    if (!updated) return res.status(404).json({ error: "not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}
