
CREATE TABLE recipe (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    people INT NOT NULL,
    instructions TEXT NOT NULL,
    source_id BIGINT
);

CREATE TABLE Ingredient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount FLOAT NULL,
    measure VARCHAR(10) NULL,
    name VARCHAR(128) NOT NULL,
    instruction TEXT NULL,
    recipe_id BIGINT,
    CONSTRAINT fk_recipe
        FOREIGN KEY (recipe_id)
            REFERENCES Recipe(id)
            ON DELETE CASCADE
);

CREATE TABLE source (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(128),
     authors VARCHAR(255)
);

ALTER TABLE recipe ADD CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id);

INSERT INTO recipe (people, name, instructions) VALUES (4,'Pancakes', 'Mix ingredients and cook on a griddle.');
SELECT * from recipe;
