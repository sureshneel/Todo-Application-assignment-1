const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");

let db = null;

const initializedDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message};`);
    process.exit(1);
  }
};

initializedDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

app.get(`/todos/`, async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;

  let data = null;
  let getTodoQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE status='${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE priority='${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE status='${status}' AND priority='${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data);
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE status='${status}' AND category='${category}';`;
          data = await db.all(getTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE category='${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE category='${category}' AND priority='${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo ;`;
      data = await db.all(getTodoQuery);
      response.send(data);
      break;
  }
});

app.get(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE id=${todoId};`;
  data = await db.get(getTodoQuery);
  response.send(data);
});

app.get(`/agenda/`, async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE due_date='${newDate}';`;
    const data = await db.all(getDateQuery);
    response.send(data);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post(`/todos/`, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const getDateQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
                                 VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
          const data = await db.run(getDateQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const { status, todo, category, priority, dueDate } = request.body;
  let updateQuery = "";
  switch (true) {
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `UPDATE todo SET status ='${status}' WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `UPDATE todo SET priority ='${priority}' WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case todo !== undefined:
      updateQuery = `UPDATE todo SET todo ='${todo}' WHERE id=${todoId};`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `UPDATE todo SET category ='${category}' WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        const getDateQuery = `UPDATE todo SET due_date ='${dueDate}' WHERE id=${todoId};`;
        const data = await db.run(getDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
