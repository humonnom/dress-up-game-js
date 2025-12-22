// 드래그 앤 드롭 게임
class DressUpGame {
  constructor() {
    this.characterArea = document.querySelector('.character-area');
    this.characterItems = document.getElementById('character-items');
    this.draggableItems = document.querySelectorAll('.draggable');
    this.draggedElement = null;
    this.offset = { x: 0, y: 0 };
    this.isDraggingFromBoard = false;

    this.init();
  }

  init() {
    // 아이템 보드의 아이템들에 드래그 이벤트 추가
    this.draggableItems.forEach(item => {
      item.addEventListener('dragstart', (e) => this.handleDragStart(e, true));
      item.addEventListener('dragend', (e) => this.handleDragEnd(e));
    });

    // 캐릭터 영역에 드롭 이벤트 추가
    this.characterArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.characterArea.addEventListener('drop', (e) => this.handleDrop(e));
    this.characterArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
  }

  handleDragStart(e, fromBoard = false) {
    this.draggedElement = e.target;
    this.isDraggingFromBoard = fromBoard;

    e.target.classList.add('dragging');
    this.characterArea.classList.add('drag-over');

    // 드래그 이미지 설정
    const img = new Image();
    img.src = e.target.src;
    e.dataTransfer.setDragImage(img, 50, 50);
    e.dataTransfer.effectAllowed = 'copy';
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this.characterArea.classList.remove('drag-over');
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  handleDragLeave(e) {
    if (e.target === this.characterArea) {
      this.characterArea.classList.remove('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.characterArea.classList.remove('drag-over');

    if (!this.draggedElement) return;

    // 아이템 보드에서 드래그한 경우 새 아이템 생성
    if (this.isDraggingFromBoard) {
      const rect = this.characterItems.getBoundingClientRect();
      const x = e.clientX - rect.left - 50; // 중앙 정렬을 위해 50 빼기
      const y = e.clientY - rect.top - 50;

      this.createItemOnCharacter(this.draggedElement, x, y);
    }

    this.draggedElement = null;
    this.isDraggingFromBoard = false;
  }

  createItemOnCharacter(sourceItem, x, y) {
    // 새로운 아이템 이미지 생성
    const newItem = document.createElement('img');
    newItem.src = sourceItem.src;
    newItem.alt = sourceItem.alt;
    newItem.className = 'placed-item';
    newItem.style.left = `${x}px`;
    newItem.style.top = `${y}px`;
    // newItem.style.width = '100%';

    // 배치된 아이템에 이동 및 제거 기능 추가
    this.addItemControls(newItem);

    this.characterItems.appendChild(newItem);
  }

  addItemControls(item) {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    // 마우스로 아이템 이동
    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // 왼쪽 클릭만

      isDragging = true;
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;

      item.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      const rect = this.characterItems.getBoundingClientRect();
      const x = currentX;
      const y = currentY;

      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        item.style.cursor = 'move';
      }
    };

    // 더블클릭으로 아이템 제거
    const handleDoubleClick = () => {
      if (confirm('이 아이템을 제거하시겠습니까?')) {
        item.remove();
      }
    };

    // 이벤트 리스너 추가
    item.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    item.addEventListener('dblclick', handleDoubleClick);

    // 초기 위치 설정
    const rect = item.getBoundingClientRect();
    currentX = parseInt(item.style.left) || 0;
    currentY = parseInt(item.style.top) || 0;
  }
}

// 페이지 로드 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
  new DressUpGame();
});
