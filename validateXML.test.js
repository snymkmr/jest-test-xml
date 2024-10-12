const fs = require('fs');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

// Define your mandatory tags here
const mandatoryTags = ['transactionId', 'mandatoryTag1', 'mandatoryTag2', 'mandatoryTag3'];

describe('XML Transaction Validation', () => {
  let transactions = [];

  beforeAll(async () => {
    try {
      const xmlFile = await fs.promises.readFile('data/sample.xml', 'utf8');
      const xmlData = await parser.parseStringPromise(xmlFile);
      
      if (xmlData && xmlData.root && Array.isArray(xmlData.root.transaction)) {
        transactions = xmlData.root.transaction;
        console.log(`Found ${transactions.length} transactions in the XML file.`);
      } else {
        console.warn('XML structure is not as expected. Please check your XML file.');
      }
    } catch (error) {
      console.error('Error reading or parsing XML file:', error);
    }
  });

  const validateTransaction = (transaction) => {
    const transactionId = transaction.transactionId ? transaction.transactionId[0] : 'Unknown';
    return mandatoryTags.reduce((issues, tag) => {
      if (!Object.prototype.hasOwnProperty.call(transaction, tag)) {
        issues.push(`Transaction ${transactionId}: Missing tag - ${tag}`);
      } else if (transaction[tag][0] === '') {
        issues.push(`Transaction ${transactionId}: Empty value for tag - ${tag}`);
      }
      return issues;
    }, []);
  };

  test('XML file should contain transactions', () => {
    expect(transactions.length).toBeGreaterThan(0);
  });

  test('All transactions should have mandatory tags with non-empty values', () => {
    const allIssues = [];  // Collect all issues across transactions

    transactions.forEach((transaction) => {
      const transactionId = transaction.transactionId ? transaction.transactionId[0] : 'Unknown';
      const issues = validateTransaction(transaction);

      if (issues.length > 0) {
        console.log(`\nIssues found in transaction ${transactionId}:`);
        issues.forEach(issue => console.log(`- ${issue}`));
        allIssues.push(...issues);  // Add all issues from this transaction to the global list
      }
    });

    // If there are any issues at all, the test will fail
    expect(allIssues).toEqual([], `Validation failed. Issues: \n${allIssues.join('\n')}`);
  });
});
