/**
 * GridEngine
 * 2.54mmピッチグリッドの座標変換・スナップ処理
 */
export class GridEngine {
  /**
   * @param {Object} boardDef  基板のJSONデータ
   * @param {number} scale     表示スケール (px/mm)
   */
  constructor(boardDef, scale = 10) {
    this.boardDef = boardDef;
    this.scale = scale; // px per mm
    this.pitch = boardDef.grid.pitch; // mm (2.54)
    this.cols = boardDef.grid.cols;
    this.rows = boardDef.grid.rows;
    this.pitchPx = this.pitch * this.scale; // px per grid step
  }

  /** グリッド座標 → ピクセル座標 (グリッドセル中心) */
  gridToPixel(gx, gy) {
    return {
      x: (gx + 0.5) * this.pitchPx,
      y: (gy + 0.5) * this.pitchPx,
    };
  }

  /** ピクセル座標 → グリッド座標 (最近傍スナップ) */
  pixelToGrid(px, py) {
    return {
      gx: Math.round(px / this.pitchPx - 0.5),
      gy: Math.round(py / this.pitchPx - 0.5),
    };
  }

  /** ピクセル座標をグリッドにスナップ (グリッドセル左上) */
  snapPixel(px, py) {
    const { gx, gy } = this.pixelToGrid(px, py);
    const clamped = this.clampGrid(gx, gy);
    return this.gridOriginPixel(clamped.gx, clamped.gy);
  }

  /** グリッド座標 → セル左上ピクセル */
  gridOriginPixel(gx, gy) {
    return {
      x: gx * this.pitchPx,
      y: gy * this.pitchPx,
    };
  }

  /** グリッド座標をボード範囲にクランプ */
  clampGrid(gx, gy) {
    return {
      gx: Math.max(0, Math.min(this.cols - 1, gx)),
      gy: Math.max(0, Math.min(this.rows - 1, gy)),
    };
  }

  /** 部品がボード内に収まるか検証 */
  partFitsOnBoard(gx, gy, partDef, rotation = 0) {
    const { cols: pCols, rows: pRows } = this.getPartGridSize(partDef, rotation);
    return (
      gx >= 0 && gy >= 0 &&
      gx + pCols <= this.cols &&
      gy + pRows <= this.rows
    );
  }

  /** 回転を考慮した部品グリッドサイズ */
  getPartGridSize(partDef, rotation = 0) {
    const c = partDef.grid.cols;
    const r = partDef.grid.rows;
    if (rotation === 90 || rotation === 270) {
      return { cols: r, rows: c };
    }
    return { cols: c, rows: r };
  }

  /** 部品の全ピンのグリッド絶対座標を計算 */
  getAbsolutePinPositions(gx, gy, partDef, rotation = 0) {
    return partDef.pins.map(pin => {
      const { pgx, pgy } = this._rotatePin(pin.gridX, pin.gridY, partDef.grid.cols - 1, partDef.grid.rows - 1, rotation);
      return {
        ...pin,
        absGx: gx + pgx,
        absGy: gy + pgy,
      };
    });
  }

  _rotatePin(px, py, maxX, maxY, rotation) {
    switch (rotation) {
      case 90:  return { pgx: maxY - py, pgy: px };
      case 180: return { pgx: maxX - px, pgy: maxY - py };
      case 270: return { pgx: py, pgy: maxX - px };
      default:  return { pgx: px, pgy: py };
    }
  }

  /** ボードSVGのピクセルサイズ */
  getBoardPixelSize() {
    return {
      width:  this.cols * this.pitchPx,
      height: this.rows * this.pitchPx,
    };
  }
}
