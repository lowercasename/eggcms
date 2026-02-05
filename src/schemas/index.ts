import type { SchemaDefinition } from "../lib/schema";
import settings from "./settings";
import post from "./post";
import person from "./person";
import page from "./page";

const schemas: SchemaDefinition[] = [settings, post, person, page];

export default schemas;
