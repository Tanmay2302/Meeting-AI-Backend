export function ok(res, data) {
  return res.status(200).json(data);
}
export function created(res, data) {
  return res.status(201).json(data);
}
export function accepted(res, data) {
  return res.status(202).json(data);
}
