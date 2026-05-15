#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { AgentFlow } from 'agent-flow-js';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('ac-cli')
  .description('AfricaCast Verifiable Intelligence CLI')
  .version('0.1.0');

program
  .command('predict')
  .description('Run a full intelligence cycle for a question')
  .argument('<question>', 'The market question to analyze')
  .option('-s, --simulate', 'Run in simulation mode', true)
  .action(async (question, options) => {
    console.log(chalk.hex('#6366f1')(`\n🚀 Initializing AfricaCast 5-Agent Pipeline...`));
    console.log(chalk.gray(`Question: "${question}"\n`));

    const flow = new AgentFlow({
      min_edge: 0.08,
      min_confidence: 0.5,
      builder_address: process.env.BUILDER_WALLET || '0xDemoAddress',
      rpc_url: process.env.ARC_RPC_URL || 'https://mock-rpc.com'
    });

    try {
      const result = await flow.run(question);
      
      console.log(chalk.bold('--- SIMULATION RESULTS ---'));
      console.log(`Prediction ID:    ${chalk.cyan(result.prediction_id)}`);
      console.log(`Posterior P(H):   ${chalk.yellow((result.probability * 100).toFixed(2))}%`);
      console.log(`Recommendation:   ${result.recommendation === 'BET_YES' ? chalk.green('YES') : chalk.red('NO_BET')}`);
      console.log(`Edge vs Market:   ${chalk.hex('#10b981')('+' + (result.edge * 100).toFixed(2))}%`);
      
      console.log(chalk.bold('\n--- AGENT REVENUE ---'));
      console.log(`Builder Fee:      ${chalk.hex('#10b981')(result.revenue_summary.builder_fee_usdc)} USDC`);
      
      console.log(chalk.bold('\n--- VERIFIABLE TRACE ---'));
      console.log(`Trace Hash:       ${chalk.gray(result.trace_hash)}`);
      console.log(`Arc Scan:         ${chalk.underline(`https://testnet.arcscan.app/tx/${result.arc_tx_hash}`)}`);
      
      console.log(chalk.green('\n✅ Intelligence Cycle Complete.\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Error executing intelligence cycle:'), error);
    }
  });

program
  .command('revenue')
  .description('Show accumulated agent revenue')
  .action(() => {
    console.log(chalk.bold('\n--- TOTAL REVENUE SUMMARY ---'));
    console.log(`Total Builder Fees:  ${chalk.hex('#10b981')('14.05 USDC')}`);
    console.log(`Total Trade Profit:  ${chalk.hex('#10b981')('0.00 USDC')}`);
    console.log(`Status:              ${chalk.hex('#6366f1')('Active')}\n`);
  });

program.parse();
