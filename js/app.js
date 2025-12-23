// 드래그 앤 드롭 게임
class DressUpGame {
  constructor() {
    this.characterArea = document.querySelector('.character-area');
    this.characterItems = document.getElementById('character-items');
    this.draggableItems = document.querySelectorAll('.draggable');
    this.draggedElement = null;
    this.offset = { x: 0, y: 0 };
    this.isDraggingFromBoard = false;

    // 파자마 요소 참조
    this.pajamaTop = document.getElementById('pajama-top');
    this.pajamaBottom = document.getElementById('pajama-bottom');

    // 카테고리별 착용한 아이템 수 추적
    this.wornItemsCount = {
      top: 0,
      outer: 0,
      pants: 0
    };

    // 카테고리별 z-index 매핑
    this.zIndexMap = {
      behindBody: -1, // 몸 뒤
      socks: 1,    // 양말
      shoes: 2,    // 신발
      pants: 3,    // 바지
      top: 4,      // 상의
      outer: 5,    // 아우터
      accessory: 6, // 액세서리
      hair: 7,     // 머리
      hat: 8,      // 모자
    };

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
    this.draggedElement = e.currentTarget;
    this.isDraggingFromBoard = fromBoard;

    e.currentTarget.classList.add('dragging');
    this.characterArea.classList.add('drag-over');

    // 드래그 이미지 설정
    if (e.currentTarget.classList.contains('item-group')) {
      // 그룹 아이템인 경우 전체 div를 드래그 이미지로 사용
      e.dataTransfer.setDragImage(e.currentTarget, 50, 50);
    } else {
      // 단일 이미지인 경우
      const img = new Image();
      img.src = e.currentTarget.src;
      e.dataTransfer.setDragImage(img, 50, 50);
    }
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
      this.createItemOnCharacter(this.draggedElement);
    }

    this.draggedElement = null;
    this.isDraggingFromBoard = false;
  }

  // 파일 경로에서 -on-body.svg 버전으로 변환
  getOnBodyPath(originalSrc) {
    return originalSrc.replace('.svg', '-on-body.svg');
  }

  getGroupItemOnBodyPaths(originalSrc) {
    const path = originalSrc.split('/').reverse()[0].split('.')[0];
    switch (path) {
      case 'backpack':
        return {
          back: originalSrc.replace('.svg', '-on-body-back.svg'),
          front: originalSrc.replace('.svg', '-on-body-front.svg'),
        }
    }
  }

  isGroupItem(src) {
    return src.includes('backpack');
  }

  createNewImgElement(src, alt, className) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = className;
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.top = '0';
    img.style.left = '0';
    return img;
  }

  createItemOnCharacter(sourceItem) {
    const category = sourceItem.dataset.category;

    if (this.isGroupItem(sourceItem.src)) {
      const newGroup = document.createElement('div');
      newGroup.className = 'placed-item placed-group';
      newGroup.dataset.category = category;
      newGroup.style.position = 'absolute';
      newGroup.style.left = "0";
      newGroup.style.top = "0";

      const {back, front} = this.getGroupItemOnBodyPaths(sourceItem.src);
      const newBackImg = this.createNewImgElement(back, sourceItem.alt, 'placed-item back');
      const newFrontImg = this.createNewImgElement(front, sourceItem.alt, 'placed-item front');

      // 그룹 아이템은 특별한 z-index 처리
      newBackImg.style.zIndex = this.zIndexMap.behindBody;  // 캐릭터 뒤
      newFrontImg.style.zIndex = this.zIndexMap.accessory; // 가방 위치

      newGroup.appendChild(newBackImg);
      newGroup.appendChild(newFrontImg);

      // 배치된 아이템에 이동 및 제거 기능 추가
      this.addItemControls(newGroup, category);
      this.characterItems.appendChild(newGroup);
    } else {
      const newItem = this.createNewImgElement(this.getOnBodyPath(sourceItem.src), sourceItem.alt);
      newItem.dataset.category = category;

      // 카테고리별 z-index 적용
      const zIndex = this.zIndexMap[category] || 1;
      newItem.style.zIndex = zIndex.toString();

      // 배치된 아이템에 이동 및 제거 기능 추가
      this.addItemControls(newItem, category);
      this.characterItems.appendChild(newItem);
    }

    // 파자마에 영향을 주는 카테고리인 경우 카운트 증가 및 업데이트
    if (category === 'top' || category === 'outer' || category === 'pants') {
      this.wornItemsCount[category]++;
      this.updatePajamaVisibility();
    }
  }

  addItemControls(item, category) {
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

        // 파자마에 영향을 주는 카테고리인 경우 카운트 감소 및 업데이트
        if (category === 'top' || category === 'outer' || category === 'pants') {
          this.wornItemsCount[category]--;
          this.updatePajamaVisibility();
        }
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

  updatePajamaVisibility() {
    // 상의 또는 아우터를 입으면 파자마 상의 숨김
    if (this.wornItemsCount.top > 0 || this.wornItemsCount.outer > 0) {
      this.pajamaTop.style.display = 'none';
    } else {
      this.pajamaTop.style.display = 'block';
    }

    // 바지를 입으면 파자마 하의 숨김
    if (this.wornItemsCount.pants > 0) {
      this.pajamaBottom.style.display = 'none';
    } else {
      this.pajamaBottom.style.display = 'block';
    }
  }
}

// 페이지 로드 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
  new DressUpGame();
});
