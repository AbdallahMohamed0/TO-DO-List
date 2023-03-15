const boardsArr = [...document.getElementsByClassName("board-box")];
const boardsShort = ["not-started", "in-progress", "completed"];
const lists = [...document.getElementsByTagName("ul")];

// Save to Local Storage
const nsBoard = JSON.parse(localStorage.getItem("not-started")) || [];
const ipBoard = JSON.parse(localStorage.getItem("in-progress")) || [];
const compBoard = JSON.parse(localStorage.getItem("completed")) || [];
const boardsStorage = [nsBoard, ipBoard, compBoard];

let startBoardIdx;
let draggedItemIdx;
let draggedItem;
let droppedItemIdx;
let endBoardIdx;

/********************************/
/* Create a task LI element */
/********************************/
function createTaskEl(listN, liN, txt = "Add a task") {
  const board = boardsArr[listN];
  const boardList = board.getElementsByClassName("list")[0];
  const liEl = document.createElement("li");

  liEl.draggable = true;
  liEl.innerHTML = `<input class="input" value="${txt}" disabled="true"/>`;
  boardList.appendChild(liEl);

  const input = liEl.getElementsByClassName("input")[0];
  input.addEventListener("blur", () => {
    disabledOnBlur(input, listN, liN);
  });

  // Add event listener for "keydown" event to disable input by Enter
  input.addEventListener("keydown", function (e) {
    if (e.keyCode === 13) {
      // Enter key = 13
      input.disabled = true;
      disabledOnBlur(input, listN, liN);
    }
  });

  // Edit button
  const editBtn = document.createElement("button");

  editBtn.className = "btn edit";
  editBtn.innerHTML = `<ion-icon name="create"></ion-icon>`;
  liEl.append(editBtn);

  // Remove button
  const removeBtn = document.createElement("button");

  removeBtn.className = "btn remove";
  removeBtn.innerHTML = `<ion-icon name="trash-bin"></ion-icon>`;
  liEl.append(removeBtn);

  removeBtn.addEventListener(
    "click",
    removeTaskElement.bind(null, listN, liN, liEl)
  );
  editBtn.addEventListener("click", editTaskInput.bind(null, liEl));
  return liEl;
}

// Disable input on blur
function disabledOnBlur(input, listNum, liNum) {
  input.disabled = true;
  const boardStore = boardsStorage[listNum];
  boardStore[liNum] = input.value;

  localStorage.setItem(boardsShort[listNum], JSON.stringify(boardStore));
}

// Remove a task LI element
function removeTaskElement(listNum, liNum, li) {
  li.remove();

  boardsStorage[listNum].splice(liNum, 1);
  localStorage.setItem(
    boardsShort[listNum],
    JSON.stringify(boardsStorage[listNum])
  );
}

// Editing Task Input Field
function editTaskInput(li) {
  const input = li.getElementsByClassName("input")[0];
  input.disabled = false;
  const end = input.value.length;
  input.setSelectionRange(end, end);
  input.focus();
}

/******************/
/* DRAG & DROP */
/******************/

function dragStart(e) {
  let targ;
  if (e.target.tagName === "LI") {
    targ = e.target;
  } else if (e.target.tagName === "INPUT") {
    targ = e.target.closest("li");
  }

  if (targ) {
    startBoardIdx = lists.findIndex((list) => list === targ.closest("ul"));

    draggedItemIdx = [...e.currentTarget.getElementsByTagName("li")].findIndex(
      (el) => el === targ
    );

    draggedItem =
      lists[startBoardIdx].getElementsByTagName("li")[draggedItemIdx];

    draggedItem.classList.add("dragged");
  }
}

function touchDrop(target) {
  lists.forEach((list) =>
    [...list.getElementsByTagName("li")].forEach((li) =>
      li.classList.remove("target")
    )
  );
  draggedItem = lists[startBoardIdx].getElementsByTagName("li")[draggedItemIdx];

  draggedItem.classList.remove("dragged");
  let droppedItem = draggedItem.cloneNode(true);

  boardsStorage[startBoardIdx].splice(draggedItemIdx, 1);

  localStorage.setItem(
    boardsShort[startBoardIdx],
    JSON.stringify(boardsStorage[startBoardIdx])
  );

  if (target === "INPUT") {
    let liEl = lists[endBoardIdx].getElementsByTagName("li")[droppedItemIdx];
    boardsStorage[endBoardIdx].splice(
      droppedItemIdx + 1,
      0,
      droppedItem.getElementsByClassName("input")[0].value
    );

    // Local Storage
    localStorage.setItem(
      boardsShort[endBoardIdx],
      JSON.stringify(boardsStorage[endBoardIdx])
    );

    // Inserting element
    liEl.insertAdjacentElement("afterend", droppedItem);
  } else if (target === "UL") {
    lists[endBoardIdx].append(droppedItem);

    // Local Storage
    boardsStorage[endBoardIdx].push(
      droppedItem.getElementsByClassName("input")[0].value
    );

    localStorage.setItem(
      boardsShort[endBoardIdx],
      JSON.stringify(boardsStorage[endBoardIdx])
    );
  }

  droppedItem
    .getElementsByClassName("btn remove")[0]
    .addEventListener(
      "click",
      removeTaskElement.bind(null, endBoardIdx, droppedItemIdx + 1, droppedItem)
    );

  droppedItem
    .getElementsByClassName("btn edit")[0]
    .addEventListener("click", editTaskInput.bind(null, droppedItem));

  const input = droppedItem.getElementsByClassName("input")[0];

  input.addEventListener(
    "blur",
    disabledOnBlur.bind(null, input, endBoardIdx, droppedItemIdx + 1 || 0)
  );

  draggedItem.remove();
}

function dragDropEvents(board) {
  const boardList = board.getElementsByClassName("list")[0];

  boardList.addEventListener("dragstart", dragStart);

  boardList.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  boardList.addEventListener("dragenter", (e) => {
    const target = e.target;
    if (e.target.tagName === "INPUT") {
      target.closest("li").classList.add("target");
    } else if (
      e.target.tagName === "UL" &&
      !e.target.getElementsByTagName("li").length
    ) {
      target.classList.add("target");
    }
  });

  boardList.addEventListener("dragleave", (e) => {
    const target = e.target;
    if (target.tagName === "INPUT") {
      target.closest("li").classList.remove("target");
    } else if (e.target.tagName === "UL") {
      target.classList.remove("target");
    }
  });

  // Drag end
  boardList.addEventListener("dragend", () => {
    draggedItem.classList.remove("dragged");
  });

  boardList.addEventListener("drop", (e) => {
    let droppedItem;

    draggedItem.classList.remove("dragged");

    let liEl;

    if (e.target.tagName === "INPUT") {
      liEl = e.target.closest("li");
      liEl.classList.remove("target");
    }

    if (
      (e.target.tagName === "INPUT" &&
        e.target.closest("li") !== draggedItem) ||
      e.target.tagName === "UL"
    ) {
      endBoardIdx = boardsArr.findIndex(
        (board) => board === e.currentTarget.closest("div")
      );

      droppedItem = draggedItem.cloneNode(true);

      boardsStorage[startBoardIdx].splice(draggedItemIdx, 1);

      // Save to Local Storage
      localStorage.setItem(
        boardsShort[startBoardIdx],
        JSON.stringify(boardsStorage[startBoardIdx])
      );

      draggedItem.remove();

      if (e.target.tagName === "INPUT") {
        droppedItemIdx = [
          ...e.currentTarget.getElementsByTagName("li"),
        ].findIndex((el) => el === liEl);
        boardsStorage[endBoardIdx].splice(
          droppedItemIdx + 1,
          0,
          droppedItem.getElementsByClassName("input")[0].value
        );

        // Save to Local Storage
        localStorage.setItem(
          boardsShort[endBoardIdx],
          JSON.stringify(boardsStorage[endBoardIdx])
        );

        liEl.insertAdjacentElement("afterend", droppedItem);
      } else if (e.target.tagName === "UL") {
        e.target.append(droppedItem);
        e.target.classList.remove("target");

        boardsStorage[endBoardIdx].push(
          droppedItem.getElementsByClassName("input")[0].value
        );

        localStorage.setItem(
          boardsShort[endBoardIdx],
          JSON.stringify(boardsStorage[endBoardIdx])
        );
      }

      // Dropped item Event Listener
      droppedItem
        .getElementsByClassName("btn remove")[0]
        .addEventListener(
          "click",
          removeTaskElement.bind(
            null,
            endBoardIdx,
            droppedItemIdx + 1,
            droppedItem
          )
        );

      droppedItem
        .getElementsByClassName("btn edit")[0]
        .addEventListener("click", editTaskInput.bind(null, droppedItem));

      const input = droppedItem.getElementsByClassName("input")[0];

      input.addEventListener(
        "blur",
        disabledOnBlur.bind(null, input, endBoardIdx, droppedItemIdx + 1 || 0)
      );
    }
  });
}

function dragDropTouchEvents(board) {
  const boardList = board.getElementsByClassName("list")[0];

  boardList.addEventListener("touchstart", dragStart);

  board.addEventListener("touchend", (e) => {
    if (e.target.tagName === "INPUT") {
      draggedItem.classList.remove("dragged");

      if (
        endBoardIdx >= 0 &&
        (endBoardIdx !== startBoardIdx || droppedItemIdx !== draggedItemIdx)
      ) {
        lists[endBoardIdx].classList.remove("target");
        if (droppedItemIdx >= 0) {
          touchDrop("INPUT");
        } else {
          touchDrop("UL");
        }
      }
    }
  });

  board.addEventListener("touchmove", (e) => {
    if (e.changedTouches[0].target.tagName === "INPUT") {
      e.preventDefault();
      const currY = e.changedTouches[0].clientY;
      const currX = e.changedTouches[0].clientX;

      const { clientHeight } = document.documentElement;
      if (currY >= clientHeight * 0.75) {
        window.scrollBy({
          top: clientHeight * 0.05,
          behavior: "smooth",
        });
      } else if (currY <= clientHeight * 0.25) {
        window.scrollBy({
          top: -clientHeight * 0.05,
          behavior: "smooth",
        });
      }

      // Calculting lists dimensions
      const rects = [];
      const lists = [...document.getElementsByTagName("ul")];
      lists.forEach((list) => rects.push(list.getBoundingClientRect()));

      const idx = rects.findIndex((rect) => {
        return (
          currY >= rect.top &&
          currY <= rect.bottom &&
          currX >= rect.left &&
          currX <= rect.right
        );
      });

      let liEls;
      let liIdx;
      if (idx >= 0) {
        if (endBoardIdx && endBoardIdx !== idx) {
          lists[endBoardIdx].classList.remove("target");
        }
        endBoardIdx = idx;
        liEls = [...lists[idx].getElementsByTagName("li")];

        liIdx = liEls.findIndex((el) => {
          const { top, bottom } = el.getBoundingClientRect();
          return currY >= top && currY <= bottom + 10;
        });
      }

      const allLis = [...document.getElementsByTagName("li")];

      if (e.target.tagName === "INPUT") {
        if (liIdx !== droppedItemIdx) {
          allLis.forEach((li) => li.classList.remove("target"));
          droppedItemIdx = liIdx;
          if (startBoardIdx !== endBoardIdx || liIdx !== draggedItemIdx) {
            if (liIdx >= 0) {
              lists[endBoardIdx].classList.remove("target");
              liEls[liIdx].classList.add("target");
            } else {
              !lists[endBoardIdx].getElementsByTagName("li").length &&
                lists[endBoardIdx].classList.add("target");
            }
          }
        }
      }
    }
  });
}

// Initialize the application by setting up boards, tasks, and drag & drop
function app() {
  // Loop through each board
  for (let i = 0; i < boardsArr.length; i++) {
    const board = boardsArr[i];
    const boardShort = boardsShort[i];
    const oldBoard = boardsStorage[i];

    const addBtn = board.getElementsByClassName("btn btn--add")[0];

    if (oldBoard.length > 0) {
      for (let j = 0; j < oldBoard.length; j++) {
        const text = oldBoard[j];
        createTaskEl(i, j, text);
      }
    }

    // Add existing tasks to the board
    addBtn.addEventListener("click", () => {
      const taskObj = "Add a task";
      const newTask = createTaskEl(i, oldBoard.length);
      oldBoard.push(taskObj);

      const input = newTask.getElementsByClassName("input")[0];
      input.disabled = false;
      input.select();
      localStorage.setItem(boardShort, JSON.stringify(oldBoard));
    });

    // Enable drag-and-drop functionality
    dragDropEvents(board);
    dragDropTouchEvents(board);
  }
}

app();
