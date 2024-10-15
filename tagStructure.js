const mandatoryTags = {
    transactionId: true,
    mandatoryTag1: true,
    mandatoryTag2: {
        subTag1: {
            subSubTag1: true,  // Nested level 3
            subSubTag2: {
                subSubSubTag1: true,  // Nested level 4
            },
        },
    },
    mandatoryTag3: true,
};

module.exports = mandatoryTags;
