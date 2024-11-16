const fs = require('fs');
const xml2js = require('xml2js');
const mandatoryTags = require('./tagStructure');

const parser = new xml2js.Parser();

// Recursive function to validate deeply nested tags
const validateTags = (transaction, tagStructure, parentTag = '') => {
  return Object.keys(tagStructure).reduce((issues, tag) => {
    const fullTagPath = parentTag ? `${parentTag} -> ${tag}` : tag;

    if (typeof tagStructure[tag] === 'object') {
      // Recursively validate nested tags
      if (!transaction[tag]) {
        issues.push(`Missing tag: ${fullTagPath}`);
      } else {
        issues.push(
          ...validateTags(transaction[tag][0], tagStructure[tag], fullTagPath)
        );
      }
    } else {
      // Simple tag validation
      if (!transaction[tag]) {
        issues.push(`Missing tag: ${fullTagPath}`);
      } else if (transaction[tag][0] === '') {
        issues.push(`Empty value for tag: ${fullTagPath}`);
      }
    }
    return issues;
  }, []);
};

const validateCount = (transaction, parentTag = '') => {
  const issues = [];

  Object.keys(transaction).forEach((tag) => {
    const fullTagPath = parentTag ? `${parentTag} -> ${tag}` : tag;

    // Check if the tag has a count attribute
    const attributes = transaction[tag]?.[0]?.$;
    if (attributes?.count) {
      const expectedCount = parseInt(attributes.count, 10);
      const actualCount = Array.isArray(transaction[tag]) ? transaction[tag].length : 0;

      if (actualCount !== expectedCount) {
        issues.push(
          `Count mismatch for tag: ${fullTagPath}. Expected: ${expectedCount}, Found: ${actualCount}`
        );
      }
    }

    // Recursively validate nested tags if they exist and are arrays
    if (Array.isArray(transaction[tag])) {
      transaction[tag].forEach((child) => {
        if (typeof child === 'object') {
          issues.push(...validateCount(child, fullTagPath));
        }
      });
    }
  });

  return issues;
};

describe('XML Transaction Validation', () => {
  let transactions = [];

  beforeAll(async () => {
    try {
      const xmlFile = await fs.promises.readFile('data/countSample.xml', 'utf8');
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

  test('XML file should contain transactions', () => {
    expect(transactions.length).toBeGreaterThan(0);
  });

  test('All transactions should have mandatory tags with non-empty values', () => {
    const allIssues = [];  // Collect all issues across transactions

    transactions.forEach((transaction) => {
      const transactionId = transaction.transactionId ? transaction.transactionId[0] : 'Unknown';
      const issues = validateTags(transaction, mandatoryTags);

      if (issues.length > 0) {
        console.log(`\nIssues found in transaction ${transactionId}:`);
        issues.forEach(issue => console.log(`- ${issue}`));
        allIssues.push(...issues.map(issue => `Transaction ${transactionId}: ${issue}`));
      }
    });

    if (allIssues.length > 0) {
      console.log(`\nAll Issues Found:\n${allIssues.join('\n')}`);
    }

    // Assert at the end when all transactions are processed
    expect(allIssues).toEqual([], `Validation failed. Issues: \n${allIssues.join('\n')}`);
  });

  test('Tags with count attributes should satisfy the total count', () => {
    const allCountIssues = [];
  
    transactions.forEach((transaction) => {
      const transactionId = transaction.transactionId ? transaction.transactionId[0] : 'Unknown';
      const issues = validateCount(transaction);
  
      if (issues.length > 0) {
        console.log(`\nCount issues found in transaction ${transactionId}:`);
        issues.forEach(issue => console.log(`- ${issue}`));
        allCountIssues.push(...issues.map(issue => `Transaction ${transactionId}: ${issue}`));
      }
    });
  
    if (allCountIssues.length > 0) {
      console.log(`\nCount Mismatch Issues Found:\n${allCountIssues.join('\n')}`);
    }
  
    expect(allCountIssues).toEqual([], `Count validation failed. Issues: \n${allCountIssues.join('\n')}`);
  });
 

});
