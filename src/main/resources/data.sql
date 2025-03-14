
CREATE TABLE recipe (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    people INT NOT NULL,
    instructions TEXT NOT NULL,
    source_id BIGINT,
    served TEXT NULL,
    page_ref VARCHAR(64) NULL,
    rating INT NULL,
    notes TEXT NULL
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

CREATE TABLE Attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    data BLOB NOT NULL,
    recipe_id BIGINT,
    CONSTRAINT fk_recipe
        FOREIGN KEY (recipe_id)
            REFERENCES Recipe(id)
            ON DELETE CASCADE,
    source_id BIGINT,
    CONSTRAINT fk_source
        FOREIGN KEY (source_id)
            REFERENCES Source(id)
            ON DELETE CASCADE
);

ALTER TABLE recipe ADD CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id);
