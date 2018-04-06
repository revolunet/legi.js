const getSommaire = require("./getSommaire");
const getArticle = require("./getArticle");

const getSectionData = (knex, filters) =>
  knex
    .clearSelect()
    .clearWhere()
    .clearOrder()
    .select()
    .from("sections")
    .where(filters)
    .first();

// generates a syntax-tree structure
// https://github.com/syntax-tree/unist
const getSection = async (knex, filters) => {
  if (!filters.parent) {
    filters.parent = null;
  }
  const sommaire = await getSommaire(knex, filters);
  if (!sommaire.map) {
    return sommaire;
  }
  return (
    sommaire &&
    Promise.all(
      sommaire.map(async section => {
        if (section.element.match(/^LEGISCTA/)) {
          return await getSection(knex, { ...filters, parent: section.element });
        } else if (section.element.match(/^LEGIARTI/)) {
          const article = await getArticle(knex, { id: section.element });
          const texteArticle = await getArticle(knex, { cid: article.cid, id: section.element });
          return {
            type: "article",
            data: {
              titre: `Article ${article.num}`,
              ...texteArticle
            }
          };
        } else {
          return {
            id: section.element
          };
          console.log("invalid section ?", section);
        }
      })
    )
      .then(async children => {
        const sectionData = await getSectionData(knex, { id: filters.parent });
        return {
          type: "section",
          data: sectionData || {},
          children
        };
      })
      .catch(console.log)
  );
};

module.exports = getSection;
