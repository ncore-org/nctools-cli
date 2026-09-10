#!/usr/bin/env node
import { runCli, NAME } from "@nctools/core";
import { cli } from "../dist/index.js";
runCli(cli(NAME + "-merge-pdf"));