#!/usr/bin/env node
import { runCli } from 'oh-my-docs';

const forwarded = ['node', 'oh-my-docs', 'init', ...process.argv.slice(2)];
await runCli(forwarded);
