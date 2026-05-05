/**
 * LibraryLoader
 * SVG + JSON ペアを読み込み、部品/基板データを提供する
 */
export class LibraryLoader {
  constructor() {
    this._cache = new Map();
    // 登録済みライブラリ一覧 (index.json がない場合のフォールバック)
    this._builtinParts = [
      { id: 'resistor',        path: 'lib/parts/resistor/resistor.json' },
      { id: 'capacitor',       path: 'lib/parts/capacitor/capacitor.json' },
      { id: 'pin-header-1x4',  path: 'lib/parts/pin-header/pin-header-1x4.json' },
      { id: 'ic-socket-dip8',  path: 'lib/parts/ic-socket/ic-socket-dip8.json' },
    ];
    this._builtinBoards = [
      { id: 'universal-2.54mm', path: 'lib/boards/universal-2.54mm.json' },
    ];
  }

  /**
   * 部品JSONを読み込む
   * @param {string} jsonPath
   * @returns {Promise<Object>} part definition
   */
  async loadPartDef(jsonPath) {
    if (this._cache.has(jsonPath)) return this._cache.get(jsonPath);
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load part: ${jsonPath}`);
    const def = await res.json();
    // SVGパスを絶対化
    const basePath = jsonPath.substring(0, jsonPath.lastIndexOf('/') + 1);
    def._svgPath = basePath + def.svg.file;
    def._jsonPath = jsonPath;
    this._cache.set(jsonPath, def);
    return def;
  }

  /**
   * 部品SVGテキストを取得
   * @param {Object} partDef
   * @returns {Promise<string>} SVG markup string
   */
  async loadPartSVG(partDef) {
    const svgPath = partDef._svgPath;
    if (this._cache.has(svgPath)) return this._cache.get(svgPath);
    const res = await fetch(svgPath);
    if (!res.ok) throw new Error(`Failed to load SVG: ${svgPath}`);
    const text = await res.text();
    this._cache.set(svgPath, text);
    return text;
  }

  /**
   * ビルトイン全部品をロード
   * @returns {Promise<Object[]>}
   */
  async loadAllBuiltinParts() {
    return Promise.all(
      this._builtinParts.map(({ path }) => this.loadPartDef(path))
    );
  }

  /**
   * ビルトイン全基板をロード
   * @returns {Promise<Object[]>}
   */
  async loadAllBuiltinBoards() {
    return Promise.all(
      this._builtinBoards.map(({ path }) => this.loadPartDef(path))
    );
  }

  /**
   * ユーザー追加部品の登録
   * ファイル選択ダイアログからJSON+SVGペアを追加
   * @param {File} jsonFile
   * @param {File} svgFile
   * @returns {Promise<Object>} part definition
   */
  async registerUserPart(jsonFile, svgFile) {
    const jsonText = await jsonFile.text();
    const def = JSON.parse(jsonText);
    const svgText = await svgFile.text();

    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    def._svgPath = svgDataUrl;
    def._jsonPath = `user:${def.id}`;
    def._isUserPart = true;

    this._cache.set(def._jsonPath, def);
    this._cache.set(svgDataUrl, svgText);
    return def;
  }
}
