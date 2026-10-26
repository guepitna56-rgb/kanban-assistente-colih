const fs = require('fs');
let schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');

schema = schema.replace(
  '  dueDate          DateTime?',
  '  startDate        DateTime?\n  dueDate          DateTime?'
);

schema = schema.replace(
  '  attachments      Attachment[]',
  '  attachments      Attachment[]\n  labels           BoardLabel[] @relation("CardLabels")\n  members          WorkspaceMember[] @relation("CardMembers")'
);

schema = schema.replace(
  '  assignedCards Card[]        @relation("CardAssignee")',
  '  assignedCards Card[]        @relation("CardAssignee")\n  cards         Card[]        @relation("CardMembers")'
);

schema = schema.replace(
  '  lists       BoardList[]',
  '  lists       BoardList[]\n  labels      BoardLabel[]'
);

const boardLabelModel = `\nmodel BoardLabel {
  id          String   @id @default(uuid())
  boardId     String
  title       String?
  color       String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  board       Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards       Card[]   @relation("CardLabels")
}
`;

if (!schema.includes('model BoardLabel')) {
  schema = schema + boardLabelModel;
}

fs.writeFileSync('server/prisma/schema.prisma', schema);
