// fake user data, with user id
const users = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" },
    { id: 3, name: "Bob Smith" },
    { id: 4, name: "Alice Johnson" },
    { id: 5, name: "Tom Brown" },
    { id: 6, name: "Sara Davis" },
    { id: 7, name: "Mike Wilson" },
    { id: 8, name: "Emily Taylor" },
    { id: 9, name: "David Lee" },
    { id: 10, name: "Karen White" },
];

const getUser = (userId) => {
    return users.find((user) => user.id === userId);
};

module.exports = {getUser}