enum itemStatus {
  Lost = "Lost",
  Found = "Found",
  Resolved = "Resolved",
}

interface Post {
  item: string;
  itemStatus: itemStatus;
  color: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  desc: string;
  photos: any;
  ownerId: string;
}

export { Post };
