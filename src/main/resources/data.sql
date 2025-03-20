
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

CREATE TABLE ingredient (
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

CREATE TABLE attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_content TEXT NOT NULL,
    recipe_id BIGINT,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

CREATE TABLE source (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(128),
     authors VARCHAR(255)
);

ALTER TABLE source ADD CONSTRAINT unique_source_name UNIQUE (name);

ALTER TABLE recipe ADD CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id);
