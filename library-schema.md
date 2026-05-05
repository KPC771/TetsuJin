# Library Schema

## ファイル構成
各部品・基板は **SVGファイル** と **JSONファイル** のペアで構成されます。

```
lib/
  boards/
    universal-2.54mm.svg       # 基板外形・穴パターン
    universal-2.54mm.json      # グリッド情報
  parts/
    resistor/
      resistor.svg             # 部品外形
      resistor.json            # ピン・グリッド情報
```

---

## 部品JSON スキーマ (`parts/*.json`)

```json
{
  "id": "resistor",
  "name": "抵抗器",
  "category": "passive",
  "description": "カーボン/金属皮膜抵抗",
  "version": "1.0.0",
  "author": "your-name",

  "grid": {
    "pitch": 2.54,
    "unit": "mm",
    "cols": 3,
    "rows": 1
  },

  "svg": {
    "file": "resistor.svg",
    "width": 3,
    "height": 1,
    "originX": 0,
    "originY": 0
  },

  "pins": [
    {
      "id": "1",
      "name": "A",
      "gridX": 0,
      "gridY": 0,
      "type": "passive"
    },
    {
      "id": "2",
      "name": "B",
      "gridX": 2,
      "gridY": 0,
      "type": "passive"
    }
  ],

  "netlist": {
    "compatible": ["through-hole-axial"],
    "footprint": "R_Axial_DIN0204_L3.6mm_D1.6mm_P2.54mm"
  },

  "tags": ["resistor", "passive", "through-hole"]
}
```

---

## 基板JSON スキーマ (`boards/*.json`)

```json
{
  "id": "universal-2.54mm",
  "name": "ユニバーサル基板 (2.54mm)",
  "version": "1.0.0",

  "grid": {
    "pitch": 2.54,
    "unit": "mm",
    "cols": 30,
    "rows": 20
  },

  "svg": {
    "file": "universal-2.54mm.svg",
    "width": 30,
    "height": 20
  },

  "holes": {
    "type": "through-hole",
    "diameter": 1.0,
    "copper_ring": 1.7,
    "pattern": "grid-all"
  }
}
```

---

## グリッド座標系

- (0,0) は左上のピン
- X: 右方向正
- Y: 下方向正
- 単位: グリッド数（実寸 = grid数 × pitch mm）

```
(0,0)  (1,0)  (2,0)
(0,1)  (1,1)  (2,1)
(0,2)  (1,2)  (2,2)
```
