import {
    objectType,
    extendType,
    nonNull,
    stringArg,
    idArg,
    intArg,
    inputObjectType,
    enumType,
    list,
    arg,
} from "nexus";
import { Prisma } from "@prisma/client";

export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderByInput",
    definition(t) {
        t.field("description", { type: Sort });
        t.field("url", { type: Sort });
        t.field("createdAt", { type: Sort });
    },
});

export const Feed = objectType({
    name: "Feed",
    definition(t) {
        t.nonNull.list.nonNull.field("links", { type: Link });
        t.nonNull.int("count");
        t.id("id");
    },
});

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"],
});

export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
        t.nonNull.dateTime("createdAt");
        // after having added the prisma schema for links and user we are adding this
        t.field("postedBy", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
        t.nonNull.list.nonNull.field("voters", {
            // 1
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .voters();
            },
        });
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

// modified to return the count(number of links in the db) with the last added link : because of take and skip arguments provided
export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("feed", {
            // 1
            type: "Feed",
            args: {
                filter: stringArg(),
                skip: intArg(),
                take: intArg(),
                orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
            },
            async resolve(parent, args, context) {
                const where = args.filter
                    ? {
                          OR: [
                              { description: { contains: args.filter } },
                              { url: { contains: args.filter } },
                          ],
                      }
                    : {};

                const links = await context.prisma.link.findMany({
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as
                        | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
                        | undefined,
                });

                const count = await context.prisma.link.count({ where }); // 2
                const id = `main-feed:${JSON.stringify(args)}`; // 3

                return {
                    // 4
                    links,
                    count,
                    id,
                };
            },
        });
    },
});

// this is for querying all the links at once
// export const LinkQuery = extendType({
//     type: "Query",
//     definition(t) {
//         t.nonNull.list.nonNull.field("feed", {
//             type: "Link",
//             args: {
//                 filter: stringArg(),
//                 // for pagination
//                 skip: intArg(),
//                 take: intArg(),
//                 // for sorting
//                 orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
//             },
//             resolve(parents, args, context, info) {
//                 // for filtering functionality
//                 const where = args.filter
//                     ? {
//                           OR: [
//                               { description: { contains: args.filter } },
//                               { url: { contains: args.filter } },
//                           ],
//                       }
//                     : {};

//                 // return links;
//                 // this works only because we've added context to prisma client
//                 // return context.prisma.link.findMany();

//                 // for filtering
//                 return context.prisma.link.findMany({
//                     where,
//                     // for pagination
//                     skip: args.skip as number | undefined,
//                     take: args.take as number | undefined,
//                     // for sorting
//                     orderBy: args.orderBy as
//                         | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
//                         | undefined,
//                 });
//             },
//         });
//     },
// });

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
                // we can do this only after having attached the token to as usedId to the context in context.ts
                const { userId } = context;

                console.log("userId: ", userId);

                if (!userId) {
                    throw new Error("Cannot post without logging in.");
                }

                const newLink = context.prisma.link.create({
                    data: {
                        description: args.description,
                        url: args.url,
                        // we can do this only after having attached the token to as usedId to the context in context.ts
                        postedBy: { connect: { id: userId } }, // 2
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

                if (
                    description === undefined ||
                    (null && url === undefined) ||
                    null
                ) {
                    throw new Error(
                        "Either description or url must be provided.",
                    );
                } else {
                    return context.prisma.link.update({
                        where: { id: parseInt(id) },
                        data: {
                            description: description as string,
                            url: url as string,
                        },
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
                return context.prisma.link.findUnique({
                    where: { id: parseInt(id) },
                });
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
                return context.prisma.link.delete({
                    where: { id: parseInt(id) },
                });
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
