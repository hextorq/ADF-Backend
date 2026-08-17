import type { Request, Response } from "express";
import * as service from "./bookstore.service.js";

// --- AUTHORS ---

export async function listAuthors(req: Request, res: Response) {
  try {
    const authors = await service.getAuthors();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch authors" });
  }
}

export async function addAuthor(req: Request, res: Response) {
  try {
    const author = await service.createAuthor(req.body);
    res.json(author);
  } catch (error) {
    res.status(500).json({ error: "Failed to create author" });
  }
}

export async function editAuthor(req: Request, res: Response) {
  try {
    const author = await service.updateAuthor(Number(req.params.id), req.body);
    res.json(author);
  } catch (error) {
    res.status(500).json({ error: "Failed to update author" });
  }
}

export async function removeAuthor(req: Request, res: Response) {
  try {
    await service.deleteAuthor(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete author" });
  }
}

// --- BOOKS ---

export async function listBooks(req: Request, res: Response) {
  try {
    const books = await service.getBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
}

export async function addBook(req: Request, res: Response) {
  try {
    const book = await service.createBook(req.body);
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: "Failed to create book" });
  }
}

export async function editBook(req: Request, res: Response) {
  try {
    const book = await service.updateBook(Number(req.params.id), req.body);
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: "Failed to update book" });
  }
}

export async function removeBook(req: Request, res: Response) {
  try {
    await service.deleteBook(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete book" });
  }
}

// --- ORDERS ---

export async function listOrders(req: Request, res: Response) {
  try {
    const orders = await service.getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

export async function changeOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const order = await service.updateOrderStatus(Number(req.params.id), status);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
}
