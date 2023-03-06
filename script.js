const boards = document.getElementsByClassName("board-box");
const boardsArr = [...boards];
const boardsShort = ["not-started", "in-progress", "completed"];

// Save to Local Storage
const nsBoard = JSON.parse(localStorage.getItem("not-started")) || [];
const ipBoard = JSON.parse(localStorage.getItem("in-progress")) || [];
const compBoard = JSON.parse(localStorage.getItem("completed")) || [];
const boardsStorage = [nsBoard, ipBoard, compBoard];

let startBoardIdx;
let draggedItemIdx;

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
  console.log(liNum, boardStore);
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
function dragDropEvents(board) {
  const boardList = board.getElementsByClassName("list")[0];

  boardList.addEventListener("dragstart", (e) => {
    startBoardIdx = boardsArr.findIndex(
      (board) => board === e.currentTarget.closest("div")
    );

    draggedItemIdx = [...e.currentTarget.getElementsByTagName("li")].findIndex(
      (el) => el === e.target
    );
  });

  boardList.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  boardList.addEventListener("dragenter", (e) => {
    const target = e.target;
    if (e.target.tagName === "INPUT") {
      target.closest("li").classList.add("target");
    }
  });

  boardList.addEventListener("dragleave", (e) => {
    const target = e.target;
    if (target.tagName === "INPUT") {
      target.closest("li").classList.remove("target");
    }
  });

  boardList.addEventListener("drop", (e) => {
    let endBoardIdx;
    let droppedItemIdx;
    let droppedItem;
    let draggedItem = boardsArr[startBoardIdx]
      .getElementsByTagName("ul")[0]
      .getElementsByTagName("li")[draggedItemIdx];

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
        console.log("UL");
        e.target.append(droppedItem);

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
      console.log(droppedItemIdx);

      input.addEventListener(
        "blur",
        disabledOnBlur.bind(null, input, endBoardIdx, droppedItemIdx + 1 || 0)
      );

      console.log(boardsStorage[endBoardIdx]);
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

    const boardList = board.getElementsByClassName("list")[0];
    const addBtn = board.getElementsByClassName("btn btn--add")[0];

    if (oldBoard.length > 0) {
      for (let j = 0; j < oldBoard.length; j++) {
        const text = oldBoard[j];
        const newTask = createTaskEl(i, j, text);
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
  }
}

app();
