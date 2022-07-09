let grid, generating = false, solving = false;
const rows = 37, columns = 37, dimensions = "10px", delay = 0, start = [0,1], end = [rows-1, columns-2];

// function to generate the grid
const generateGridWithVal = (val, n, m) => {
  let arr = new Array(n);
  for(let i=0; i<n; i++) {
    arr[i] = new Array(m);
    for(let j=0; j<m; j++) {
      arr[i][j] = val;
    }
  }
  return arr;
}

// initial setup
const init = () => {
  grid = generateGridWithVal(0, rows, columns);
  let container = document.getElementById('container');
  container.style.display = 'flex';
  for(let i=0; i<rows; i++) {
    let row = document.createElement('div');
    for(let j=0; j<columns; j++) {
      let node = document.createElement('div');
      node.className = 'node';
      node.id = i + ',' + j;
      row.appendChild(node);
    }
    container.appendChild(row);
  }
}
init();

// Function to show the gird
const animate = () => {
  for(let i=0; i<rows; i++) {
    for(let j=0; j<columns; j++) {
      if(grid[i][j] == 0) {
        document.getElementById(i+','+j).style.backgroundColor = 'black';
      }
      if(grid[i][j] == 1) {
        document.getElementById(i+','+j).style.backgroundColor = 'white';
      }
      if(grid[i][j] == 2) {
        document.getElementById(i+','+j).style.backgroundColor = 'yellow';
      }
      if(grid[i][j] == 3) {
        document.getElementById(i+','+j).style.backgroundColor = 'green';
      }
      if(grid[i][j] == 4) {
        document.getElementById(i+','+j).style.backgroundColor = 'blue';
      }
    }
  }
}

const wait = () => new Promise(resolve => setTimeout(resolve, delay));

const changed = async ([x, y], val) => {
  grid[x][y] = val;
  animate();
  await wait();
}

// Maze generation algorithm
const generateMaze = async () => {
  if(generating || solving)
    return;
  generating = true;
  let vis = generateGridWithVal(0, rows, columns);
  grid = generateGridWithVal(0, rows, columns);
  let stack = [];
  let dx = [0, -2, 0, 2], dy = [-2, 0, 2, 0];
  stack.push([1,1,1,1]);
  await changed(start, 1);
  while(stack.length > 0) {
    let top = stack[stack.length - 1];
    stack.pop();
    if(Math.floor(Math.random()*10) <= 3) {
      stack.unshift(top);
      continue;
    }
    let x = top[0], y = top[1];
    if(vis[x][y]==1)
      continue;
    vis[x][y] = 1;
    await changed([top[2], top[3]], 1);
    await changed([x,y], 1);
    for(let k=0, r = Math.floor(Math.random()*4); k<4; k++) {
      let ind = (k+r)%4, nx = x+dx[ind], ny = y+dy[ind];
      if(nx>0 && nx<rows && ny>0 && ny<columns && vis[nx][ny] == 0) 
        stack.push([nx, ny, x+dx[ind]/2, y+dy[ind]/2]);
    }
  }
  grid[end[0]][end[1]] = 1;
  animate();
  wait();
  generating = false;
}
generateMaze();

// Priority Queue for Astar
const peek = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[peek];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > peek) 
      this._swap(peek, bottom);
    
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > peek && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  _siftDown() {
    let node = peek;
    while ((left(node) < this.size() && this._greater(left(node), node)) || (right(node) < this.size() && this._greater(right(node), node))) {
      let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

// heuristic value
const h = (a, b) => Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]);

// Algorithm to solve the maze
const Astar = async () => {
  if(generating || solving)
    return;
  solving = true;
  for(let i=0; i<rows; i++) {
    for(let j=0; j<columns; j++) {
      if(grid[i][j]!=0)
        grid[i][j] = 1;
    }
  }
  let vis = generateGridWithVal(0, rows, columns);
  let par = generateGridWithVal([-1,-1], rows, columns);
  let dx = [0 ,1, 0, -1], dy = [1, 0, -1, 0];
  vis[start[0]][start[1]] = 1;
  let queue = new PriorityQueue((a, b) => a[0]<=b[0]);
  queue.push([h(start, end), start]);
  while(!queue.isEmpty()) {
    let [hx, x] = queue.pop();
    await changed([x[0], x[1]], 3);
    if(x[0]===end[0] && x[1]==end[1]) 
      break;

    for(let i=0; i<4; i++) {
      let nx = x[0]+dx[i], ny = x[1]+dy[i];
      if(nx>0 && nx<rows && ny>0 && ny<columns && grid[nx][ny] == 1) {
        par[nx][ny] = x;
        queue.push([h(end,[nx,ny]) + 1, [nx,ny]]);
        grid[nx][ny] = 2;
      }
    }
  }
  let [x,y] = end;
  while(x!==-1 && y!==-1) {
    await changed([x,y], 4);
    [x,y] = par[x][y];
  }
  solving = false;
}
