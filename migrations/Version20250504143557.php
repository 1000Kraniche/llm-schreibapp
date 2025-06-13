<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250504143557 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE app_user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, user_name VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, role LONGTEXT NOT NULL COMMENT '(DC2Type:json)', created_at DATE NOT NULL COMMENT '(DC2Type:date_immutable)', updated_at DATE DEFAULT NULL COMMENT '(DC2Type:date_immutable)', UNIQUE INDEX UNIQ_88BDF3E9E7927C74 (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE llminteraction (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, prompt LONGTEXT NOT NULL, response LONGTEXT NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_92D25CB166D1F9C (project_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE note (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, parent_note_id INT DEFAULT NULL, title VARCHAR(255) NOT NULL, content LONGTEXT DEFAULT NULL, INDEX IDX_CFBDFA14166D1F9C (project_id), INDEX IDX_CFBDFA1454A57C13 (parent_note_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE project (id INT AUTO_INCREMENT NOT NULL, owner_id INT NOT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_2FB3D0EE7E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE text_document (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, content LONGTEXT NOT NULL, updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', is_current TINYINT(1) NOT NULL, INDEX IDX_6E2B0664166D1F9C (project_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE llminteraction ADD CONSTRAINT FK_92D25CB166D1F9C FOREIGN KEY (project_id) REFERENCES project (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE note ADD CONSTRAINT FK_CFBDFA14166D1F9C FOREIGN KEY (project_id) REFERENCES project (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE note ADD CONSTRAINT FK_CFBDFA1454A57C13 FOREIGN KEY (parent_note_id) REFERENCES note (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE project ADD CONSTRAINT FK_2FB3D0EE7E3C61F9 FOREIGN KEY (owner_id) REFERENCES app_user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE text_document ADD CONSTRAINT FK_6E2B0664166D1F9C FOREIGN KEY (project_id) REFERENCES project (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE llminteraction DROP FOREIGN KEY FK_92D25CB166D1F9C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE note DROP FOREIGN KEY FK_CFBDFA14166D1F9C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE note DROP FOREIGN KEY FK_CFBDFA1454A57C13
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE project DROP FOREIGN KEY FK_2FB3D0EE7E3C61F9
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE text_document DROP FOREIGN KEY FK_6E2B0664166D1F9C
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE app_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE llminteraction
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE note
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE project
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE text_document
        SQL);
    }
}
