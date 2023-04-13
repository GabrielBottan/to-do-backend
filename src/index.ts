import express, { Request, Response } from "express";
import cors from "cors";
import { db } from "./database/knex";
import { unwatchFile } from "fs";
import { TuserDB, TtaskDb } from "./database/types";
import { create } from "domain";

const app = express();

app.use(cors());
app.use(express.json());

app.listen(3003, () => {
  console.log(`Servidor rodando na porta ${3003}`);
});

app.get("/users", async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;

    if (q === undefined) {
      const result = await db("users");
      res.status(200).send(result);
    } else {
      const result = await db("users").where("name", "LIKE", `%${q}%`);
      res.status(200).send(result);
    }
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});

app.post("/users", async (req: Request, res: Response) => {
  try {
    const { id, name, email, password } = req.body;
    if (typeof id !== "string") {
      res.status(400);
      throw new Error("Id deve ser uma string");
    }
    if (id.length < 3) {
      res.status(400);
      throw new Error("Id deve ter pelo menos 3 caracteres");
    }

    if (typeof name !== "string") {
      res.status(400);
      throw new Error("O nome deve ser uma string");
    }
    if (name.length < 2) {
      res.status(400);
      throw new Error("O nome deve ter pelo menos 3 caracteres");
    }

    if (typeof email !== "string") {
      res.status(400);
      throw new Error("O email deve ser uma string");
    }
    if (
      !password.match(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,12}$/g
      )
    ) {
      throw new Error(
        "A senha deve possuir entre 8 e 12 caracteres, com letras maiúsculas e minúsculas e no mínimo um número e um caractere especial"
      );
    }

    const [userIdExists]: TuserDB[] | undefined[] = await db("users").where({
      id,
    });

    if (userIdExists) {
      res.status(400);
      throw new Error("Este id já existe");
    }

    const [userEmailExist]: TuserDB[] | undefined[] = await db("users").where({
      email,
    });

    if (userEmailExist) {
      res.status(400);
      throw new Error("Este email já existe");
    }

    const newUser: TuserDB = {
      id,
      name,
      email,
      password,
    };
    await db("users").insert(newUser);
    res.status(201).send({ message: "Novo usuario cadastrado", user: newUser });
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});

app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const idToDelete = req.params.id;
    const [userIdExists]: TuserDB[] | undefined[] = await db("users").where({
      id: idToDelete,
    });

    if (!userIdExists) {
      res.status(404);
      throw new Error("Usuario não encontrado");
    }
    await db("users").del().where({ id: idToDelete });
    res.status(200).send({ message: "Usuario deletado com sucesso!" });
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});

app.get("/tasks", async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;

    if (q === undefined) {
      const result = await db("tasks");
      res.status(200).send(result);
    } else {
      const result = await db("tasks")
        .where("name", "LIKE", `%${q}%`)
        .orWhere("name", "LIKE", `%${q}%`);
      res.status(200).send(result);
    }
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});

app.post("/tasks", async (req: Request, res: Response) => {
  try {
    const { id, title, description } = req.body;
    if (typeof id !== "string") {
      res.status(400);
      throw new Error("Id deve ser uma string");
    }
    if (id.length < 3) {
      res.status(400);
      throw new Error("Id deve ter pelo menos 3 caracteres");
    }

    if (typeof title !== "string") {
      res.status(400);
      throw new Error("O titulo deve ser uma string");
    }
    if (title.length < 2) {
      res.status(400);
      throw new Error("O titulo deve ter pelo menos 3 caracteres");
    }

    if (typeof description !== "string") {
      res.status(400);
      throw new Error(" A descrição deve ser uma string");
    }

    const [taskIdExists]: TtaskDb[] | undefined[] = await db("tasks").where({
      id,
    });

    if (taskIdExists) {
      res.status(400);
      throw new Error("Este id já existe");
    }

    const newTask = {
      id,
      title,
      description,
    };
    await db("tasks").insert(newTask);
    const [insertedTask]: TtaskDb[] = await db("tasks").where({ id });

    res
      .status(201)
      .send({ message: "Nova tarefa cadastrada", task: insertedTask });
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});

app.put("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const idToEdit = req.params.id;

    const newId = req.body.id;
    const newTitle = req.body.title;
    const newDescription = req.body.description;
    const newCreatedAt = req.body.createdAt;
    const newStatus = req.body.status;

    if (newId !== undefined) {
      if (typeof newId !== "string") {
        res.status(400);
        throw new Error("Id deve ser uma string");
      }
      if (newId.length < 3) {
        res.status(400);
        throw new Error("Id deve ter pelo menos 3 caracteres");
      }
    }

    if (newTitle !== undefined) {
      if (typeof newTitle !== "string") {
        res.status(400);
        throw new Error("O titulo deve ser uma string");
      }
      if (newTitle.length < 2) {
        res.status(400);
        throw new Error("O titulo deve ter pelo menos 3 caracteres");
      }
    }
    if (newDescription !== undefined) {
      if (typeof newDescription !== "string") {
        res.status(400);
        throw new Error(" A descrição deve ser uma string");
      }
    }
    if (newCreatedAt !== undefined) {
      if (typeof newCreatedAt !== "string") {
        res.status(400);
        throw new Error(" A created_at deve ser uma string");
      }
    }
    if (newStatus !== undefined) {
      if (typeof newStatus !== "number") {
        res.status(400);
        throw new Error(" O status deve ser um  number (0 ou 1");
      }
    }

    const [task]: TtaskDb[] | undefined[] = await db("tasks").where({
      id: idToEdit,
    });

    if (!task) {
      res.status(400);
      throw new Error("Id não encontrado");
    }

    const newTask: TtaskDb = {
      id: newId || task.id,
      title: newTitle || task.title,
      description: newDescription || task.description,
      created_at: newCreatedAt || task.created_at,
      status: isNaN(newStatus) ? task.status : newStatus,
    };
    await db("tasks").update(newTask).where({ id: idToEdit });

    res
      .status(200)
      .send({ message: "Tarefa editada com sucesso", task: newTask });
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send(error.message);
    } else {
      res.send("Erro inesperado");
    }
  }
});
