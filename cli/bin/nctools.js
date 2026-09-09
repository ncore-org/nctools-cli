#!/usr/bin/env node
import { runCli } from "@nctools/core";
import { buildMetaCli } from "../dist/index.js";
runCli(buildMetaCli());