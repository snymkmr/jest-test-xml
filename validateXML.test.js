const fs = require('fs');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

// Define your mandatory tags here
const mandatoryTags = ['mandatoryTag1', 'mandatoryTag2', 'mandatoryTag3'];

describe('XML Validation', () => {
  let xmlData;

  beforeAll(async () => {
    const xmlFile = await fs.promises.readFile('data/sample.xml', 'utf8');
    xmlData = await parser.parseStringPromise(xmlFile);
    console.log(xmlData);
  });

  test('All mandatory tags should have values', () => {
    const root = xmlData.root;

    mandatoryTags.forEach(tag => {
      expect(root).toHaveProperty(tag);
      expect(root[tag][0]).toBeTruthy();
    });
  });
});
