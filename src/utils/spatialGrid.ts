// ============================================================
// SweetReturns — Optimized Spatial Grid
// Zero-allocation neighbor queries using pre-allocated buffer.
// ============================================================

export class SpatialGrid {
  private invCellSize: number;
  private cells: Map<number, number[]>;
  private neighborBuffer: number[];

  constructor(cellSize = 4.0) {
    this.invCellSize = 1.0 / cellSize;
    this.cells = new Map();
    this.neighborBuffer = [];
  }

  clear() {
    // Reuse arrays instead of recreating
    for (const cell of this.cells.values()) {
      cell.length = 0;
    }
  }

  private hashKey(cx: number, cz: number): number {
    // Spatial hash: pack two ints into one key
    return ((cx + 500) * 2003) + (cz + 500);
  }

  insert(idx: number, x: number, z: number) {
    const cx = Math.floor(x * this.invCellSize);
    const cz = Math.floor(z * this.invCellSize);
    const key = this.hashKey(cx, cz);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(idx);
  }

  // Returns shared buffer — caller must NOT store the reference
  getNeighbors(x: number, z: number): number[] {
    const cx = Math.floor(x * this.invCellSize);
    const cz = Math.floor(z * this.invCellSize);
    this.neighborBuffer.length = 0;

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cell = this.cells.get(this.hashKey(cx + dx, cz + dz));
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            this.neighborBuffer.push(cell[i]);
          }
        }
      }
    }

    return this.neighborBuffer;
  }
}
