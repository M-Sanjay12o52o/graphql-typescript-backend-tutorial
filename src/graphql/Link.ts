import { NexusGenObjects } from "../../nexus-typegen";
import { objectType, extendType, nonNull, stringArg, idArg } from "nexus";

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("description");
    t.nonNull.string("url");
  },
});

// let links: NexusGenObjects["Link"][] = [
//   {
//     id: 1,
//     url: "www.howtographql.com",
//     description: "Fullstack tutorial for GraphQL",
//   },
//   {
//     id: 2,
//     url: "graphql.org",
//     description: "GraphQL official website",
//   },
// ];

// this is for querying all the links at once
export const LinkQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("feed", {
      type: "Link",
      resolve(parents, args, context, info) {
        // return links;
        // this works only because we've added context to prisma client
        return context.prisma.link.findMany();
      },
    });
  },
});

export const LinkMutation = extendType({
  // this is for adding a link to the existing links
  type: "Mutation",
  definition(t) {
    t.nonNull.field("post", {
      type: "Link",
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        const { description, url } = args;

        const newLink = context.prisma.link.create({
          data: {
            description: args.description,
            url: args.url,
          },
        });

        return newLink;

        // let idCount = links.length + 1;
        // const link = {
        //   id: idCount,
        //   description: description,
        //   url: url,
        // };
        // links.push(link);
        // return link;
      },
    });

    // this is to update an existing link
    t.nullable.field("updateLink", {
      type: "Link",
      args: {
        id: nonNull(idArg()),
        description: stringArg(),
        url: stringArg(),
      },
      resolve(_, args, context) {
        const { id, description, url } = args;

        if (description === undefined || (null && url === undefined) || null) {
          throw new Error("Either description or url must be provided.");
        } else {
          return context.prisma.link.update({
            where: { id: parseInt(id) },
            data: { description, url },
          });
        }

        // const index = links.findIndex((link) => link.id === parseInt(id));
        // if (index === -1) return null;
        // if (description !== undefined && description !== null)
        //   links[index].description = description;
        // if (url !== undefined && url !== null) links[index].url = url;

        // return links[index];
      },
    });

    // fetching a link by it's id
    t.nullable.field("fetchLink", {
      type: "Link",
      args: {
        id: nonNull(idArg()),
      },
      resolve(_, { id }, context) {
        return context.prisma.link.findUnique({ where: { id: parseInt(id) } });
      },
      // resolve(_, args) {
      //   const { id } = args;
      //   const link = links.find((link) => link.id === parseInt(id));
      //   return link || null;
      // },
    });

    // deleting a link by it's id
    t.nullable.field("deleteLink", {
      type: "Link",
      args: {
        id: nonNull(idArg()),
      },
      resolve(_, { id }, context) {
        return context.prisma.link.delete({ where: { id: parseInt(id) } });
      },

      // resolve(_, args) {
      //   const { id } = args;
      //   const index = links.findIndex((link) => link.id === parseInt(id));
      //   if (index === -1) return null;
      //   const deletedLink = links.splice(index, 1)[0];
      //   return deletedLink;
      // },
    });
  },
});
