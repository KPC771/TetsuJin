/**
 * ProjectState
 * 配置された部品の状態管理・Undo/Redo・シリアライズ
 */
export class ProjectState {
  constructor() {
    this.boardId = null;
    this.boardDef = null;
    this.placements = []; // { id, partId, partDef, gx, gy, rotation, label }
    this._nextId = 1;
    this._history = [];   // Undo履歴
    this._future = [];    // Redo履歴
    this._listeners = new Set();
  }

  /** 変更通知リスナー登録 */
  onChange(fn) { this._listeners.add(fn); }
  _emit() { this._listeners.forEach(fn => fn(this)); }

  /** 基板をセット */
  setBoard(boardDef) {
    this._pushHistory();
    this.boardDef = boardDef;
    this.boardId = boardDef.id;
    this._emit();
  }

  /** 部品を配置 */
  place(partDef, gx, gy, rotation = 0) {
    this._pushHistory();
    const placement = {
      id: this._nextId++,
      partId: partDef.id,
      partDef,
      gx,
      gy,
      rotation,
      label: '',
    };
    this.placements.push(placement);
    this._emit();
    return placement;
  }

  /** 部品を移動 */
  move(placementId, gx, gy) {
    this._pushHistory();
    const p = this.placements.find(p => p.id === placementId);
    if (p) { p.gx = gx; p.gy = gy; }
    this._emit();
  }

  /** 部品を回転 (90度ステップ) */
  rotate(placementId) {
    this._pushHistory();
    const p = this.placements.find(p => p.id === placementId);
    if (p) { p.rotation = (p.rotation + 90) % 360; }
    this._emit();
  }

  /** 部品を削除 */
  remove(placementId) {
    this._pushHistory();
    this.placements = this.placements.filter(p => p.id !== placementId);
    this._emit();
  }

  /** ラベルを設定 */
  setLabel(placementId, label) {
    this._pushHistory();
    const p = this.placements.find(p => p.id === placementId);
    if (p) p.label = label;
    this._emit();
  }

  /** Undo */
  undo() {
    if (!this._history.length) return;
    this._future.push(this._snapshot());
    const snap = this._history.pop();
    this._restore(snap);
    this._emit();
  }

  /** Redo */
  redo() {
    if (!this._future.length) return;
    this._history.push(this._snapshot());
    const snap = this._future.pop();
    this._restore(snap);
    this._emit();
  }

  get canUndo() { return this._history.length > 0; }
  get canRedo() { return this._future.length > 0; }

  _pushHistory() {
    this._history.push(this._snapshot());
    this._future = [];
    if (this._history.length > 100) this._history.shift();
  }

  _snapshot() {
    return {
      boardId: this.boardId,
      placements: this.placements.map(p => ({ ...p })),
      nextId: this._nextId,
    };
  }

  _restore(snap) {
    this.boardId = snap.boardId;
    this.placements = snap.placements.map(p => ({ ...p }));
    this._nextId = snap.nextId;
  }

  /** JSONにシリアライズ (SVGデータは含めない) */
  toJSON() {
    return JSON.stringify({
      version: '1.0',
      boardId: this.boardId,
      placements: this.placements.map(({ id, partId, gx, gy, rotation, label }) => ({
        id, partId, gx, gy, rotation, label
      })),
    }, null, 2);
  }

  /** JSONからリストア */
  fromJSON(jsonStr, partDefs) {
    const data = JSON.parse(jsonStr);
    this.boardId = data.boardId;
    this.placements = data.placements.map(p => {
      const partDef = partDefs.find(d => d.id === p.partId);
      return { ...p, partDef };
    }).filter(p => p.partDef);
    this._nextId = Math.max(...this.placements.map(p => p.id), 0) + 1;
    this._history = [];
    this._future = [];
    this._emit();
  }
}
