let lastId = Number(localStorage.getItem('lastId'));
const data = JSON.parse(localStorage.getItem('tasks'));

function removeTaskFromColumn(column, item) {
  const { tasks } = column;
  tasks.splice(tasks.indexOf(item), 1);
  // eslint-disable-next-line no-use-before-define
  renderColumn(column);
}

function getParentByClass(element, className) {
  if (element.classList.contains(className)) {
    return element;
  }
  return element.closest(`.${className}`);
}

function destroyElement(element) {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

function createPlaceholderElement(width, height) {
  const placeholderElement = document.createElement('div');
  placeholderElement.style.width = `${width}px`;
  placeholderElement.style.height = `${height}px`;
  placeholderElement.style['min-height'] = `${height}px`;
  placeholderElement.style.backgroundColor = '#F0FFFF';
  placeholderElement.style.display = 'block';
  return placeholderElement;
}

function getClosestItem(columnItems, y) {
  for (const item of columnItems.childNodes) {
    if (item.getBoundingClientRect().top > y) {
      return item;
    }
  }

  return null;
}

function startDragging(cardElement, item, draggingEvent) {
  const element = cardElement;
  const shiftX = draggingEvent.clientX - element.getBoundingClientRect().left;
  const shiftY = draggingEvent.clientY - element.getBoundingClientRect().top;

  const placeholderElement = createPlaceholderElement(element.offsetWidth, element.offsetHeight);

  element.style.width = `${element.offsetWidth}px`;
  element.style.height = `${element.offsetHeight}px`;
  element.classList.add('dragging');
  document.querySelector('body').appendChild(element);

  function renderDraggable(pageX, pageY) {
    const targetElement = document.elementFromPoint(pageX, pageY);
    if (!targetElement) {
      return;
    }

    const targetColumnElement = getParentByClass(targetElement, 'column');
    if (targetColumnElement && targetElement !== placeholderElement) {
      const targetColumnItemsElement = targetColumnElement.querySelector('.columnItems');
      const closestCardElement = getClosestItem(targetColumnItemsElement, pageY);
      if (closestCardElement) {
        targetColumnItemsElement.insertBefore(placeholderElement, closestCardElement);
      } else {
        targetColumnItemsElement.appendChild(placeholderElement);
      }
    }

    element.style.left = `${pageX - shiftX}px`;
    element.style.top = `${pageY - shiftY}px`;
  }

  renderDraggable(draggingEvent.pageX, draggingEvent.pageY);

  function handleMouseMove(event) {
    renderDraggable(event.pageX, event.pageY);
    event.preventDefault();
  }

  function handleMouseUp(event) {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    event.preventDefault();

    const insertAfter = placeholderElement.previousSibling;

    destroyElement(element);
    destroyElement(placeholderElement);

    const targetElement = document.elementFromPoint(event.pageX, event.pageY);
    const targetColumnElement = getParentByClass(targetElement, 'column');
    const targetColumn = data.find((column) => column.containerId === targetColumnElement.getAttribute('id'));
    if (!insertAfter) {
      targetColumn.tasks.unshift(item);
    } else {
      const insertAfterId = Number(insertAfter.getAttribute('data-id'));
      const insertAfterIdx = targetColumn.tasks.findIndex((task) => task.id === insertAfterId);
      targetColumn.tasks.splice(insertAfterIdx + 1, 0, item);
    }

    // eslint-disable-next-line no-use-before-define
    renderColumn(targetColumn);
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function renderColumn(column) {
  const { tasks, containerId } = column;
  const columnContent = document.querySelector(`#${containerId} > .columnItems`);
  columnContent.replaceChildren();

  for (const item of tasks) {
    const { content, id } = item;
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('cardContainer');
    cardContainer.textContent = content;
    cardContainer.setAttribute('data-id', id);
    cardContainer.onmousedown = (event) => {
      startDragging(cardContainer, item, event);
      removeTaskFromColumn(column, item);
      event.preventDefault();
    };

    const remove = document.createElement('div');
    remove.classList.add('remove');
    remove.textContent = '✖';
    cardContainer.appendChild(remove);

    remove.onclick = () => {
      removeTaskFromColumn(column, item);
    };

    remove.onmousedown = (event) => {
      event.stopPropagation();
    };

    columnContent.appendChild(cardContainer);
  }

  localStorage.setItem('tasks', JSON.stringify(data));
}

function bindColumn(column) {
  const container = document.getElementById(column.containerId);
  const cardPanel = container.querySelector('.addCardPanel');

  container.querySelector('.showAddCardPanel').onclick = () => {
    cardPanel.classList.remove('hidden');
  };

  cardPanel.querySelector('.closeAddCardPanel').onclick = () => {
    cardPanel.classList.add('hidden');
  };

  cardPanel.querySelector('.addCardButton').onclick = () => {
    const content = cardPanel.querySelector('.newCardContent');
    const error = cardPanel.querySelector('.addCardErrorText');
    if (content.value === '') {
      error.textContent = 'Ошибка, заполните поле';
      return;
    }

    lastId += 1;
    localStorage.setItem('lastId', String(lastId));
    column.tasks.push({ content: content.value, id: lastId });
    renderColumn(column);

    cardPanel.classList.add('hidden');
    content.value = '';
  };

  // render first time
  renderColumn(column);
}

for (const column of data) {
  bindColumn(column);
}
